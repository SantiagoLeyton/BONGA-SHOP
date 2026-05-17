import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type CartView = {
  key: string;
  product: Product;
  variantId: string;
  flavor: string;
  nicotineMg: number;
  price: number;
  qty: number;
  lineTotal: number;
};

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, TranslatePipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });
  readonly busyKey = signal<string | null>(null);
  readonly clearing = signal(false);

  readonly lines = computed<CartView[]>(() => {
    const list = this.productList();
    const byId = new Map(list.map((product) => [product.id, product]));
    return this.cart.items().flatMap((line) => {
      const product = byId.get(line.productId);
      if (!product) return [];
      const variant = product.variants.find((item) => item.id === line.variantId) ?? product.variants[0];
      if (!variant) return [];
      const price = variant.price;
      return [
        {
          key: `${product.id}::${variant.id}`,
          product,
          variantId: variant.id,
          flavor: variant.flavor,
          nicotineMg: variant.nicotineMg,
          price,
          qty: line.qty,
          lineTotal: price * line.qty,
        },
      ];
    });
  });

  readonly subtotal = computed(() => this.lines().reduce((sum, line) => sum + line.lineTotal, 0));
  readonly total = computed(() => this.subtotal());
  readonly isLoading = computed(() => !this.cart.loaded());

  async inc(line: CartView): Promise<void> {
    const variant = line.product.variants.find((item) => item.id === line.variantId);
    if (variant && line.qty >= variant.stock) {
      this.toasts.show('Llegaste al stock maximo.', 'warning', 'Carrito');
      return;
    }
    await this.runCartAction(line.key, () => this.cart.add(line.product.id, line.variantId, 1));
  }

  async dec(line: CartView): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.setQty(line.product.id, line.variantId, line.qty - 1));
  }

  async remove(line: CartView): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.remove(line.product.id, line.variantId));
  }

  async clear(): Promise<void> {
    if (!this.lines().length || this.clearing()) {
      return;
    }
    if (!window.confirm('Se quitaran todos los productos de tu carrito. Quieres continuar?')) {
      return;
    }

    this.clearing.set(true);
    try {
      await this.cart.clear();
      this.toasts.show('Tu carrito quedo vacio.', 'info', 'Carrito');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el carrito.';
      this.toasts.show(message, 'danger', 'Carrito');
    } finally {
      this.clearing.set(false);
    }
  }

  async changeVariant(line: CartView, nextVariantId: string): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.changeVariant(line.product.id, line.variantId, nextVariantId));
  }

  isBusy(line: CartView): boolean {
    return this.busyKey() === line.key;
  }

  private async runCartAction(key: string, action: () => Promise<void>): Promise<void> {
    if (this.busyKey() === key) {
      return;
    }

    this.busyKey.set(key);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el carrito.';
      this.toasts.show(message, 'danger', 'Carrito');
    } finally {
      this.busyKey.set(null);
    }
  }
}
