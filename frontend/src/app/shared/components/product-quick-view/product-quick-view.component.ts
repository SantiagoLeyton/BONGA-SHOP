import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import type { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
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
  private readonly cart = inject(CartService);
  private readonly cartUi = inject(CartUiService);

  @Input({ required: true }) isOpen = false;
  @Input({ required: false }) product?: Product;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  minPrice(): number {
    const product = this.product;
    if (!product?.variants?.length) return 0;
    return Math.min(...product.variants.map((variant) => variant.price));
  }

  addToCart(): void {
    const product = this.product;
    const variant = product?.variants.find((item) => item.stock > 0) ?? product?.variants[0];

    if (!product || !variant) {
      return;
    }

    if (variant.stock <= 0) {
      this.toast.show('Este producto esta agotado.', 'warning', 'Carrito');
      return;
    }

    this.cart.add(product.id, variant.id, 1);
    this.toast.show(`${product.name} · ${variant.flavor}`, 'success', 'Anadido al carrito');
    this.cartUi.show();
    this.close();
  }
}
