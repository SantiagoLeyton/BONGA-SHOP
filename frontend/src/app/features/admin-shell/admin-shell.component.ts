import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BrandService } from '../../core/services/brand.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';

interface AdminNavItem {
  readonly id: 'overview' | 'products' | 'brands' | 'inventory' | 'orders';
  readonly label: string;
  readonly caption: string;
  readonly icon: string;
  readonly path: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly products = inject(ProductService);
  private readonly brandsService = inject(BrandService);
  private readonly inventoryService = inject(InventoryService);
  private readonly ordersService = inject(OrderService);

  private readonly productsData = toSignal(this.products.getProducts(), { initialValue: [] });
  private readonly brandsData = toSignal(this.brandsService.getBrands(), { initialValue: [] });
  private readonly inventoryData = toSignal(this.inventoryService.listInventory(), { initialValue: [] });
  private readonly adminOrdersData = toSignal(this.ordersService.getAdminOrders(), { initialValue: [] });

  readonly navItems: readonly AdminNavItem[] = [
    {
      id: 'overview',
      label: 'Resumen',
      caption: 'Panel general',
      icon: 'dashboard',
      path: 'resumen',
    },
    {
      id: 'products',
      label: 'Productos',
      caption: 'Catálogo',
      icon: 'box',
      path: 'productos',
    },
    {
      id: 'brands',
      label: 'Marcas',
      caption: 'Fabricantes',
      icon: 'tag',
      path: 'marcas',
    },
    {
      id: 'inventory',
      label: 'Inventario',
      caption: 'Stock por variante',
      icon: 'layers',
      path: 'inventario',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      caption: 'Gestión y estado',
      icon: 'receipt',
      path: 'pedidos',
    },
  ];

  readonly counts = computed(() => ({
    overview: 0,
    products: this.productsData().length,
    brands: this.brandsData().length,
    inventory: this.inventoryData().length,
    orders: this.adminOrdersData().length,
  }));

  readonly lowStockCount = computed(() => this.inventoryData().filter((item) => item.lowStock).length);

  countFor(id: AdminNavItem['id']): number {
    return this.counts()[id] ?? 0;
  }
}
