import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import type { Product } from '../../core/models/product.model';
import { AdminProductModalComponent } from '../../shared/components/admin-product-modal/admin-product-modal.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [RouterLink, AdminProductModalComponent, DecimalPipe],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);

  readonly all = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(8);

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

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );

  readonly view = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const size = this.pageSize();
    const start = (p - 1) * size;
    return this.filtered().slice(start, start + size);
  });

  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);

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

  saveProduct(next: Product): void {
    this.products.upsertProduct(next);
    this.modalOpen.set(false);
    this.toasts.show('Producto guardado (mock)', 'success', 'Admin');
  }

  deleteProduct(p: Product): void {
    this.products.deleteProduct(p.id);
    this.toasts.show('Producto eliminado (mock)', 'info', 'Admin');
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

  stockTotal(p: Product): number {
    return p.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  minPrice(p: Product): number {
    return Math.min(...p.variants.map((v) => v.price));
  }
}
