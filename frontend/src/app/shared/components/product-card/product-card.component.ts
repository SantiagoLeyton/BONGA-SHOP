import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Product } from '../../../core/models/product.model';
import { ProductBadgeComponent } from '../product-badge/product-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, ProductBadgeComponent, DecimalPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() showQuickView = false;
  @Output() quickView = new EventEmitter<Product>();

  minPrice(): number {
    return Math.min(...this.product.variants.map((v) => v.price));
  }

  primaryFlavor(): string {
    return this.product.variants[0]?.flavor ?? '';
  }

  nicotineRange(): string {
    const values = this.product.variants.map((v) => v.nicotineMg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min} mg` : `${min}–${max} mg`;
  }

  openQuickView(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickView.emit(this.product);
  }
}
