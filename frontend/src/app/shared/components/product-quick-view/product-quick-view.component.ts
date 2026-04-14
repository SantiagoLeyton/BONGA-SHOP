import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import type { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ProductBadgeComponent } from '../product-badge/product-badge.component';

@Component({
  selector: 'app-product-quick-view',
  standalone: true,
  imports: [ModalShellComponent, DecimalPipe, ProductBadgeComponent],
  templateUrl: './product-quick-view.component.html',
  styleUrl: './product-quick-view.component.scss',
})
export class ProductQuickViewComponent {
  private readonly toast = inject(ToastService);

  @Input({ required: true }) isOpen = false;
  @Input({ required: false }) product?: Product;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  minPrice(): number {
    const p = this.product;
    if (!p?.variants?.length) return 0;
    return Math.min(...p.variants.map((v) => v.price));
  }

  addToCart(): void {
    this.toast.show('Carrito próximamente. UI lista para integrar.', 'info', 'BONGA SHOP');
  }
}

