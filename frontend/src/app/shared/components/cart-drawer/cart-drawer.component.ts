import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

type ViewLine = {
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
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, TranslatePipe],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
})
export class CartDrawerComponent {
  private readonly cart = inject(CartService);
  private readonly ui = inject(CartUiService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);

  readonly isOpen = this.ui.open;
  readonly count = this.cart.count;
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });
  readonly busyKey = signal<string | null>(null);
  readonly clearing = signal(false);
  readonly loading = this.cart.loaded;

  readonly viewLines = computed<ViewLine[]>(() => {
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

  readonly subtotal = computed(() => this.viewLines().reduce((sum, line) => sum + line.lineTotal, 0));

  close(): void {
    this.ui.hide();
  }

  async inc(line: ViewLine): Promise<void> {
    const variant = line.product.variants.find((item) => item.id === line.variantId);
    if (variant && line.qty >= variant.stock) {
      this.toasts.show('Llegaste al stock maximo.', 'warning', 'Carrito');
      return;
    }
    await this.runCartAction(line.key, () => this.cart.add(line.product.id, line.variantId, 1));
  }

  async dec(line: ViewLine): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.setQty(line.product.id, line.variantId, line.qty - 1));
  }

  async remove(line: ViewLine): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.remove(line.product.id, line.variantId));
  }

  async clear(): Promise<void> {
    if (!this.viewLines().length || this.clearing()) {
      return;
    }
    if (!window.confirm('Se quitaran todos los productos del carrito. Quieres continuar?')) {
      return;
    }

    this.clearing.set(true);
    try {
      await this.cart.clear();
      this.toasts.show('Carrito vaciado correctamente.', 'info', 'Carrito');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el carrito.';
      this.toasts.show(message, 'danger', 'Carrito');
    } finally {
      this.clearing.set(false);
    }
  }

  async changeVariant(line: ViewLine, nextVariantId: string): Promise<void> {
    await this.runCartAction(line.key, () => this.cart.changeVariant(line.product.id, line.variantId, nextVariantId));
  }

  isBusy(line: ViewLine): boolean {
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
