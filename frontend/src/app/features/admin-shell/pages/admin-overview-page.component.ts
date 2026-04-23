import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../core/services/brand.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-admin-overview-page',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './admin-overview-page.component.html',
  styleUrl: './admin-pages.shared.scss',
})
export class AdminOverviewPageComponent {
  private readonly products = inject(ProductService);
  private readonly brandsService = inject(BrandService);
  private readonly inventoryService = inject(InventoryService);
  private readonly ordersService = inject(OrderService);

  private readonly productsData = toSignal(this.products.getProducts(), { initialValue: [] });
  private readonly brandsData = toSignal(this.brandsService.getBrands(), { initialValue: [] });
  private readonly inventoryData = toSignal(this.inventoryService.listInventory(), { initialValue: [] });
  private readonly adminOrdersData = toSignal(this.ordersService.getAdminOrders(), { initialValue: [] });

  readonly metrics = computed(() => {
    const orders = this.adminOrdersData();
    return {
      revenue: orders.reduce((sum, order) => sum + order.total, 0),
      orders: orders.length,
      lowStock: this.inventoryData().filter((item) => item.lowStock).length,
      products: this.productsData().length,
      brands: this.brandsData().length,
      inventoryItems: this.inventoryData().length,
    };
  });

  readonly recentOrders = computed(() =>
    [...this.adminOrdersData()]
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
      .slice(0, 5),
  );
}
