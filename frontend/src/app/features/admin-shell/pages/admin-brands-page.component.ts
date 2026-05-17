import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Brand } from '../../../core/models/brand.model';
import { BrandService } from '../../../core/services/brand.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-brands-page',
  standalone: true,
  imports: [],
  templateUrl: './admin-brands-page.component.html',
  styleUrl: './admin-pages.shared.scss',
})
export class AdminBrandsPageComponent {
  private readonly brandsService = inject(BrandService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);

  readonly brands = toSignal(this.brandsService.getBrands(), { initialValue: [] });
  readonly allProducts = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly query = signal('');
  readonly brandDraft = signal('');
  readonly editingBrand = signal<string | null>(null);
  readonly brandEditValue = signal('');
  readonly brandSaving = signal(false);
  readonly deletingBrandId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.brands();
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
  });

  productCount(brandId: string): number {
    return this.allProducts().filter((p) => p.brand?.id === brandId).length;
  }

  async createBrand(): Promise<void> {
    const name = this.brandDraft().trim();
    if (!name) return;

    this.brandSaving.set(true);
    try {
      await this.brandsService.createBrand(name);
      this.products.refresh();
      this.brandDraft.set('');
      this.toasts.show('Marca creada correctamente.', 'success', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo crear la marca.'), 'danger', 'Marcas');
    } finally {
      this.brandSaving.set(false);
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
    if (!name) return;

    this.brandSaving.set(true);
    try {
      await this.brandsService.updateBrand(brand.id, name);
      this.products.refresh();
      this.cancelBrandEdit();
      this.toasts.show('Marca actualizada correctamente.', 'success', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar la marca.'), 'danger', 'Marcas');
    } finally {
      this.brandSaving.set(false);
    }
  }

  async deleteBrand(brand: Brand): Promise<void> {
    if (!window.confirm(`Eliminar la marca ${brand.name}?`)) return;

    this.deletingBrandId.set(brand.id);
    try {
      await this.brandsService.deleteBrand(brand.id);
      this.products.refresh();
      this.toasts.show('Marca eliminada correctamente.', 'info', 'Marcas');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo eliminar la marca.'), 'danger', 'Marcas');
    } finally {
      this.deletingBrandId.set(null);
    }
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  setBrandDraft(v: string): void {
    this.brandDraft.set(v);
  }

  setBrandEditValue(v: string): void {
    this.brandEditValue.set(v);
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
