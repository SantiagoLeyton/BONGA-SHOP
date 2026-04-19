import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import type { Product } from '../../core/models/product.model';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

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
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly lines = computed<CartView[]>(() => {
    const list = this.productList();
    const byId = new Map(list.map((p) => [p.id, p]));
    return this.cart.items().flatMap((l) => {
      const p = byId.get(l.productId);
      if (!p) return [];
      const v = p.variants.find((x) => x.id === l.variantId) ?? p.variants[0];
      if (!v) return [];
      const price = v.price;
      return [
        {
          key: `${p.id}::${v.id}`,
          product: p,
          variantId: v.id,
          flavor: v.flavor,
          nicotineMg: v.nicotineMg,
          price,
          qty: l.qty,
          lineTotal: price * l.qty,
        },
      ];
    });
  });

  readonly subtotal = computed(() => this.lines().reduce((sum, l) => sum + l.lineTotal, 0));
  readonly total = computed(() => this.subtotal());

  inc(l: CartView): void {
    const v = l.product.variants.find((x) => x.id === l.variantId);
    if (v && l.qty >= v.stock) {
      this.toasts.show('Llegaste al stock maximo.', 'warning', 'Carrito');
      return;
    }
    this.cart.add(l.product.id, l.variantId, 1);
  }

  dec(l: CartView): void {
    this.cart.setQty(l.product.id, l.variantId, l.qty - 1);
  }

  remove(l: CartView): void {
    this.cart.remove(l.product.id, l.variantId);
  }

  clear(): void {
    this.cart.clear();
  }

  changeVariant(l: CartView, nextVariantId: string): void {
    this.cart.changeVariant(l.product.id, l.variantId, nextVariantId);
  }
}
