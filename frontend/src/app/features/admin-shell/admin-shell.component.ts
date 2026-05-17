import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { AdminRecommendation, RecommendationPriority } from '../../core/models/admin-recommendation.model';
import { AdminRecommendationService } from '../../core/services/admin-recommendation.service';
import { BrandService } from '../../core/services/brand.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface AdminNavItem {
  readonly id: 'overview' | 'products' | 'brands' | 'inventory' | 'orders';
  readonly labelKey: string;
  readonly captionKey: string;
  readonly icon: string;
  readonly path: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly products = inject(ProductService);
  private readonly brandsService = inject(BrandService);
  private readonly inventoryService = inject(InventoryService);
  private readonly ordersService = inject(OrderService);
  private readonly recommendationsService = inject(AdminRecommendationService);

  private readonly productsData = toSignal(this.products.getProducts(), { initialValue: [] });
  private readonly brandsData = toSignal(this.brandsService.getBrands(), { initialValue: [] });
  private readonly inventoryData = toSignal(this.inventoryService.listInventory(), { initialValue: [] });
  private readonly adminOrdersData = toSignal(this.ordersService.getAdminOrders(), { initialValue: [] });

  readonly navItems: readonly AdminNavItem[] = [
    {
      id: 'overview',
      labelKey: 'overview',
      captionKey: 'generalPanel',
      icon: 'dashboard',
      path: 'resumen',
    },
    {
      id: 'products',
      labelKey: 'products',
      captionKey: 'catalogTitle',
      icon: 'box',
      path: 'productos',
    },
    {
      id: 'brands',
      labelKey: 'brands',
      captionKey: 'makers',
      icon: 'tag',
      path: 'marcas',
    },
    {
      id: 'inventory',
      labelKey: 'inventory',
      captionKey: 'variantStock',
      icon: 'layers',
      path: 'inventario',
    },
    {
      id: 'orders',
      labelKey: 'orders',
      captionKey: 'managementStatus',
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
  readonly recommendationsOpen = signal(false);
  readonly recommendationsLoading = signal(false);
  readonly recommendations = signal<AdminRecommendation[]>([]);
  readonly expandedRecommendation = signal<number | null>(0);

  countFor(id: AdminNavItem['id']): number {
    return this.counts()[id] ?? 0;
  }

  async openRecommendations(): Promise<void> {
    this.recommendationsOpen.set(true);
    await this.loadRecommendations();
  }

  closeRecommendations(): void {
    this.recommendationsOpen.set(false);
  }

  async refreshRecommendations(): Promise<void> {
    await this.loadRecommendations();
  }

  toggleRecommendation(index: number): void {
    this.expandedRecommendation.update((current) => (current === index ? null : index));
  }

  priorityLabel(priority: RecommendationPriority): string {
    switch (priority) {
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
      default:
        return 'Baja';
    }
  }

  priorityClass(priority: RecommendationPriority): string {
    return `admin-ai-card__priority admin-ai-card__priority--${priority.toLowerCase()}`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeRecommendations();
  }

  private async loadRecommendations(): Promise<void> {
    this.recommendationsLoading.set(true);
    try {
      const items = await this.recommendationsService.list();
      this.recommendations.set(items);
      this.expandedRecommendation.set(items.length ? 0 : null);
    } finally {
      this.recommendationsLoading.set(false);
    }
  }
}
