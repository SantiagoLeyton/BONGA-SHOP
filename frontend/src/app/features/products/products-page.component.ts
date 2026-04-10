import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrandService } from '../../core/services/brand.service';
import { ProductService } from '../../core/services/product.service';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import {
  applyProductFilters,
  defaultFilterState,
  uniqueFlavors,
  type ProductFilterState,
} from '../../shared/utils/product-filter.util';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [FilterPanelComponent, ProductCardComponent],
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

  onFiltersChange(next: ProductFilterState): void {
    this.filters.set(next);
  }
}
