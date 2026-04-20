import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductBadgeComponent } from '../product-badge/product-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, ProductBadgeComponent, DecimalPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private readonly wishlist = inject(WishlistService);
  private readonly toasts = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);

  @Input({ required: true }) product!: Product;
  @Input() showQuickView = false;
  @Output() quickView = new EventEmitter<Product>();

  readonly wished = computed(() => this.wishlist.has(this.product?.id));

  minPrice(): number {
    return Math.min(...this.product.variants.map((variant) => variant.price));
  }

  primaryFlavor(): string {
    return this.product.variants[0]?.flavor ?? '';
  }

  nicotineRange(): string {
    const values = this.product.variants.map((variant) => variant.nicotineMg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min} mg` : `${min}-${max} mg`;
  }

  openQuickView(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  async toggleWish(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isAuthed()) {
      this.modal.openLogin();
      this.toasts.show('Inicia sesion para guardar favoritos.', 'info', 'Cuenta');
      return;
    }

    try {
      const isOn = await this.wishlist.toggle(this.product.id);
      this.toasts.show(
        isOn ? 'Guardado en favoritos' : 'Quitado de favoritos',
        isOn ? 'success' : 'info',
        'Favoritos',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar favoritos.';
      this.toasts.show(message, 'danger', 'Favoritos');
    }
  }
}
