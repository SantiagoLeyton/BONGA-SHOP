import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import type { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ProductBadgeComponent } from '../product-badge/product-badge.component';

@Component({
  selector: 'app-product-quick-view',
  standalone: true,
  imports: [ModalShellComponent, AppCurrencyPipe, ProductBadgeComponent],
  templateUrl: './product-quick-view.component.html',
  styleUrl: './product-quick-view.component.scss',
})
export class ProductQuickViewComponent {
  private readonly toast = inject(ToastService);
  private readonly cart = inject(CartService);
  private readonly cartUi = inject(CartUiService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  @Input({ required: true }) isOpen = false;
  @Input({ required: false }) product?: Product;
  @Output() closed = new EventEmitter<void>();

  readonly adding = signal(false);

  close(): void {
    this.closed.emit();
  }

  minPrice(): number {
    const product = this.product;
    if (!product?.variants?.length) return 0;
    return Math.min(...product.variants.map((variant) => variant.price));
  }

  async addToCart(): Promise<void> {
    const product = this.product;
    const variant = product?.variants.find((item) => item.stock > 0) ?? product?.variants[0];

    if (!product || !variant) {
      return;
    }

    if (!this.auth.isAuthed()) {
      this.modal.openLogin();
      this.toast.show('Inicia sesion para agregar productos al carrito.', 'info', 'Cuenta');
      return;
    }

    if (variant.stock <= 0) {
      this.toast.show('Este producto esta agotado.', 'warning', 'Carrito');
      return;
    }

    this.adding.set(true);
    try {
      await this.cart.add(product.id, variant.id, 1);
      this.toast.show(`${product.name} · ${variant.flavor}`, 'success', 'Añadido al carrito');
      this.cartUi.show();
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el carrito.';
      this.toast.show(message, 'danger', 'Carrito');
    } finally {
      this.adding.set(false);
    }
  }
}
