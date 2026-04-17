import { Component, Input } from '@angular/core';
import type { ProductBadge } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-badge',
  standalone: true,
  templateUrl: './product-badge.component.html',
  styleUrl: './product-badge.component.scss',
})
export class ProductBadgeComponent {
  @Input({ required: true }) badge!: ProductBadge;

  label(): string {
    switch (this.badge) {
      case 'new':
        return 'Nuevo';
      case 'popular':
        return 'Popular';
      case 'low-stock':
        return 'Stock bajo';
      default:
        return '';
    }
  }
}
