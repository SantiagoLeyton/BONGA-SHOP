import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrandService } from '../../core/services/brand.service';
import { ProductService } from '../../core/services/product.service';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../shared/components/skeleton/product-card-skeleton.component';
import { RevealScrollDirective } from '../../shared/directives/reveal-scroll.directive';
import {
  applyProductFilters,
  defaultFilterState,
  uniqueFlavors,
  type ProductFilterState,
} from '../../shared/utils/product-filter.util';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [FilterPanelComponent, ProductCardComponent, ProductCardSkeletonComponent, RevealScrollDirective],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent {
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);

  readonly allProducts = toSignal(this.productService.getProducts(), { initialValue: [] });
  readonly brands = toSignal(this.brandService.getBrands(), { initialValue: [] });

  readonly filters = signal<ProductFilterState>(defaultFilterState());

  readonly flavors = computed(() => uniqueFlavors(this.allProducts()));

  readonly filtered = computed(() => applyProductFilters(this.allProducts(), this.filters()));

  readonly initialLoading = computed(() => this.allProducts().length === 0);

  readonly density = signal<'comfortable' | 'compact'>('comfortable');

  readonly activeChips = computed(() => {
    const f = this.filters();
    const brands = this.brands();
    const chips: Array<{ key: string; label: string; type: string; value?: string }> = [];

    f.brandSlugs.forEach((slug) => {
      const name = brands.find((b) => b.slug === slug)?.name ?? slug;
      chips.push({ key: `brand:${slug}`, label: `Marca: ${name}`, type: 'brand', value: slug });
    });
    f.flavors.forEach((flavor) => chips.push({ key: `flavor:${flavor}`, label: `Sabor: ${flavor}`, type: 'flavor', value: flavor }));
    if (f.nicotineMin != null) chips.push({ key: 'nicMin', label: `Nicotina ≥ ${f.nicotineMin} mg`, type: 'nicMin' });
    if (f.nicotineMax != null) chips.push({ key: 'nicMax', label: `Nicotina ≤ ${f.nicotineMax} mg`, type: 'nicMax' });
    if (f.priceMin != null) chips.push({ key: 'pMin', label: `Precio ≥ ${f.priceMin} €`, type: 'pMin' });
    if (f.priceMax != null) chips.push({ key: 'pMax', label: `Precio ≤ ${f.priceMax} €`, type: 'pMax' });

    return chips;
  });

  onFiltersChange(next: ProductFilterState): void {
    this.filters.set(next);
  }

  clearAll(): void {
    this.filters.set(defaultFilterState());
  }

  removeChip(type: string, value?: string): void {
    const f = this.filters();
    switch (type) {
      case 'brand':
        this.filters.set({ ...f, brandSlugs: f.brandSlugs.filter((s) => s !== value) });
        return;
      case 'flavor':
        this.filters.set({ ...f, flavors: f.flavors.filter((s) => s !== value) });
        return;
      case 'nicMin':
        this.filters.set({ ...f, nicotineMin: null });
        return;
      case 'nicMax':
        this.filters.set({ ...f, nicotineMax: null });
        return;
      case 'pMin':
        this.filters.set({ ...f, priceMin: null });
        return;
      case 'pMax':
        this.filters.set({ ...f, priceMax: null });
        return;
      default:
        return;
    }
  }

  setDensity(next: 'comfortable' | 'compact'): void {
    this.density.set(next);
  }
}
