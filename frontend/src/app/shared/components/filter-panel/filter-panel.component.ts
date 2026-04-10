import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Brand } from '../../../core/models/brand.model';
import type { ProductFilterState, ProductSort } from '../../utils/product-filter.util';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
})
export class FilterPanelComponent {
  @Input({ required: true }) brands: Brand[] = [];
  @Input({ required: true }) flavors: string[] = [];
  @Input({ required: true }) value!: ProductFilterState;

  @Output() valueChange = new EventEmitter<ProductFilterState>();

  toggleBrand(slug: string, checked: boolean): void {
    const set = new Set(this.value.brandSlugs);
    if (checked) {
      set.add(slug);
    } else {
      set.delete(slug);
    }
    this.emit({ ...this.value, brandSlugs: [...set] });
  }

  toggleFlavor(flavor: string, checked: boolean): void {
    const set = new Set(this.value.flavors);
    if (checked) {
      set.add(flavor);
    } else {
      set.delete(flavor);
    }
    this.emit({ ...this.value, flavors: [...set] });
  }

  updateNicotineMin(value: string): void {
    const n = value === '' ? null : Number(value);
    this.emit({ ...this.value, nicotineMin: Number.isFinite(n as number) ? (n as number) : null });
  }

  updateNicotineMax(value: string): void {
    const n = value === '' ? null : Number(value);
    this.emit({ ...this.value, nicotineMax: Number.isFinite(n as number) ? (n as number) : null });
  }

  updatePriceMin(value: string): void {
    const n = value === '' ? null : Number(value);
    this.emit({ ...this.value, priceMin: Number.isFinite(n as number) ? (n as number) : null });
  }

  updatePriceMax(value: string): void {
    const n = value === '' ? null : Number(value);
    this.emit({ ...this.value, priceMax: Number.isFinite(n as number) ? (n as number) : null });
  }

  updateSort(value: string): void {
    this.emit({ ...this.value, sort: value as ProductSort });
  }

  reset(): void {
    this.emit({
      brandSlugs: [],
      flavors: [],
      nicotineMin: null,
      nicotineMax: null,
      priceMin: null,
      priceMax: null,
      sort: 'featured',
    });
  }

  private emit(next: ProductFilterState): void {
    this.valueChange.emit(next);
  }

  brandChecked(slug: string): boolean {
    return this.value.brandSlugs.includes(slug);
  }

  flavorChecked(flavor: string): boolean {
    return this.value.flavors.includes(flavor);
  }
}
