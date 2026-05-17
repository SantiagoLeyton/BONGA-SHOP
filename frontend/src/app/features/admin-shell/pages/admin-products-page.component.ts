import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Product } from '../../../core/models/product.model';
import { BrandService } from '../../../core/services/brand.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AdminProductModalComponent,
  type AdminProductSavedEvent,
} from '../../../shared/components/admin-product-modal/admin-product-modal.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [AdminProductModalComponent, AppCurrencyPipe],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-pages.shared.scss',
})
export class AdminProductsPageComponent {
  private readonly products = inject(ProductService);
  private readonly brandsService = inject(BrandService);
  private readonly inventoryService = inject(InventoryService);
  private readonly toasts = inject(ToastService);

  readonly all = toSignal(this.products.getProducts(), { initialValue: [] as Product[] });
  readonly brands = toSignal(this.brandsService.getBrands(), { initialValue: [] });

  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly productSaving = signal(false);
  readonly deletingProductId = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);

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

  async saveProduct(event: AdminProductSavedEvent): Promise<void> {
    this.productSaving.set(true);
    try {
      const saved = await this.products.upsertProduct(event.draft);
      if (event.imageFile) {
        try {
          await this.products.uploadProductImage(saved.id, event.imageFile);
        } catch (imageError) {
          // El producto sí se guardó; solo avisamos que la imagen falló para no perder el progreso.
          this.toasts.show(
            this.errorMessage(imageError, 'El producto se guardó pero la imagen no se pudo subir.'),
            'warning',
            'Admin',
          );
          this.inventoryService.refresh();
          this.modalOpen.set(false);
          return;
        }
      }
      this.inventoryService.refresh();
      this.modalOpen.set(false);
      this.toasts.show('Producto guardado correctamente.', 'success', 'Admin');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo guardar el producto.'), 'danger', 'Admin');
    } finally {
      this.productSaving.set(false);
    }
  }

  async deleteProduct(p: Product): Promise<void> {
    if (!window.confirm(`Eliminar ${p.name}?`)) {
      return;
    }

    this.deletingProductId.set(p.id);
    try {
      await this.products.deleteProduct(p.id);
      this.inventoryService.refresh();
      this.toasts.show('Producto eliminado correctamente.', 'info', 'Admin');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo eliminar el producto.'), 'danger', 'Admin');
    } finally {
      this.deletingProductId.set(null);
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

  stockTotal(p: Product): number {
    return p.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  minPrice(p: Product): number {
    return p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
