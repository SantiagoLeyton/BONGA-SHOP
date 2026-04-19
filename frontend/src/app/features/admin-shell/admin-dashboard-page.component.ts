import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { Brand } from '../../core/models/brand.model';
import type { InventoryRecord } from '../../core/models/inventory.model';
import type { Product } from '../../core/models/product.model';
import type { OrderStatus } from '../../core/models/order.model';
import { BrandService } from '../../core/services/brand.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService, type AdminOrderSummary } from '../../core/services/order.service';
import { ProductService, type AdminProductDraft } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminProductModalComponent } from '../../shared/components/admin-product-modal/admin-product-modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [RouterLink, AdminProductModalComponent, DatePipe, AppCurrencyPipe],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly products = inject(ProductService);
  private readonly brandsService = inject(BrandService);
  private readonly inventoryService = inject(InventoryService);
  private readonly ordersService = inject(OrderService);
  private readonly toasts = inject(ToastService);

  readonly all = toSignal(this.products.getProducts(), { initialValue: [] as Product[] });
  readonly brands = toSignal(this.brandsService.getBrands(), { initialValue: [] as Brand[] });
  readonly inventory = toSignal(this.inventoryService.listInventory(), { initialValue: [] as InventoryRecord[] });
  readonly adminOrders = toSignal(this.ordersService.getAdminOrders(), { initialValue: [] as AdminOrderSummary[] });

  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(8);
  readonly brandDraft = signal('');
  readonly editingBrand = signal<string | null>(null);
  readonly brandEditValue = signal('');
  readonly inventoryLowStockOnly = signal(false);
  readonly orderStatusFilter = signal<'all' | OrderStatus>('all');
  readonly orderUserFilter = signal('');

  readonly stockDrafts = signal<Record<string, number>>({});
  readonly orderStatusDrafts = signal<Record<string, OrderStatus>>({});

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.all();
    if (!q) return list;
    return list.filter((p) => {
      const hay = [p.name, p.slug, p.brand?.name, p.brand?.slug, ...p.variants.map((v) => v.flavor)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  readonly view = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const size = this.pageSize();
    const start = (p - 1) * size;
    return this.filtered().slice(start, start + size);
  });

  readonly visibleInventory = computed(() => {
    const lowStockOnly = this.inventoryLowStockOnly();
    return this.inventory().filter((item) => (!lowStockOnly ? true : item.lowStock));
  });

  readonly visibleOrders = computed(() => {
    const status = this.orderStatusFilter();
    const userId = this.orderUserFilter().trim();
    return this.adminOrders().filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }
      if (userId && order.userId !== userId) {
        return false;
      }
      return true;
    });
  });

  readonly metrics = computed(() => ({
    revenue: this.adminOrders().reduce((sum, order) => sum + order.total, 0),
    orders: this.adminOrders().length,
    lowStock: this.inventory().filter((item) => item.lowStock).length,
  }));

  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly orderStatuses: OrderStatus[] = ['created', 'processing', 'shipped', 'delivered', 'cancelled'];

  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: Product): void {
    this.editing.set(p);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async saveProduct(next: AdminProductDraft): Promise<void> {
    try {
      await this.products.upsertProduct(next);
      this.inventoryService.refresh();
      this.modalOpen.set(false);
      this.toasts.show('Producto guardado correctamente.', 'success', 'Admin');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo guardar el producto.'), 'danger', 'Admin');
    }
  }

  async deleteProduct(p: Product): Promise<void> {
    if (!window.confirm(`Eliminar ${p.name}?`)) {
      return;
    }

    try {
      await this.products.deleteProduct(p.id);
      this.inventoryService.refresh();
      this.toasts.show('Producto eliminado correctamente.', 'info', 'Admin');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo eliminar el producto.'), 'danger', 'Admin');
    }
  }

  async createBrand(): Promise<void> {
    const name = this.brandDraft().trim();
    if (!name) {
      return;
    }

    try {
      await this.brandsService.createBrand(name);
      this.products.refresh();
      this.brandDraft.set('');
      this.toasts.show('Marca creada correctamente.', 'success', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo crear la marca.'), 'danger', 'Marcas');
    }
  }

  startBrandEdit(brand: Brand): void {
    this.editingBrand.set(brand.id);
    this.brandEditValue.set(brand.name);
  }

  cancelBrandEdit(): void {
    this.editingBrand.set(null);
    this.brandEditValue.set('');
  }

  async saveBrand(brand: Brand): Promise<void> {
    const name = this.brandEditValue().trim();
    if (!name) {
      return;
    }

    try {
      await this.brandsService.updateBrand(brand.id, name);
      this.products.refresh();
      this.cancelBrandEdit();
      this.toasts.show('Marca actualizada correctamente.', 'success', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar la marca.'), 'danger', 'Marcas');
    }
  }

  async deleteBrand(brand: Brand): Promise<void> {
    if (!window.confirm(`Eliminar la marca ${brand.name}?`)) {
      return;
    }

    try {
      await this.brandsService.deleteBrand(brand.id);
      this.products.refresh();
      this.toasts.show('Marca eliminada correctamente.', 'info', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo eliminar la marca.'), 'danger', 'Marcas');
    }
  }

  setQuery(v: string): void {
    this.query.set(v);
    this.page.set(1);
  }

  prev(): void {
    this.page.update((x) => Math.max(1, x - 1));
  }

  next(): void {
    this.page.update((x) => Math.min(this.totalPages(), x + 1));
  }

  setBrandDraft(value: string): void {
    this.brandDraft.set(value);
  }

  setBrandEditValue(value: string): void {
    this.brandEditValue.set(value);
  }

  toggleLowStock(): void {
    this.inventoryLowStockOnly.update((value) => !value);
  }

  stockValue(item: InventoryRecord): number {
    return this.stockDrafts()[item.variantId] ?? item.stock;
  }

  setStockDraft(variantId: string, value: string): void {
    const parsed = Number(value);
    this.stockDrafts.update((drafts) => ({
      ...drafts,
      [variantId]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  async saveStock(item: InventoryRecord): Promise<void> {
    try {
      await this.inventoryService.updateStock(item.variantId, this.stockValue(item));
      this.stockDrafts.update((drafts) => {
        const next = { ...drafts };
        delete next[item.variantId];
        return next;
      });
      this.products.refresh();
      this.toasts.show('Stock actualizado correctamente.', 'success', 'Inventario');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar el stock.'), 'danger', 'Inventario');
    }
  }

  statusValue(order: AdminOrderSummary): OrderStatus {
    return this.orderStatusDrafts()[order.id] ?? order.status;
  }

  setOrderStatusDraft(orderId: string, value: string): void {
    this.orderStatusDrafts.update((drafts) => ({
      ...drafts,
      [orderId]: value as OrderStatus,
    }));
  }

  async saveOrderStatus(order: AdminOrderSummary): Promise<void> {
    try {
      await this.ordersService.updateAdminOrderStatus(order.id, this.statusValue(order));
      this.orderStatusDrafts.update((drafts) => {
        const next = { ...drafts };
        delete next[order.id];
        return next;
      });
      this.toasts.show('Estado de orden actualizado.', 'success', 'Pedidos');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar la orden.'), 'danger', 'Pedidos');
    }
  }

  setOrderStatusFilter(value: string): void {
    this.orderStatusFilter.set(value as 'all' | OrderStatus);
  }

  setOrderUserFilter(value: string): void {
    this.orderUserFilter.set(value);
  }

  stockTotal(p: Product): number {
    return p.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  minPrice(p: Product): number {
    return p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
  }

  statusLabel(status: OrderStatus): string {
    switch (status) {
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviada';
      case 'delivered':
        return 'Entregada';
      case 'cancelled':
        return 'Cancelada';
      case 'created':
      default:
        return 'Creada';
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
