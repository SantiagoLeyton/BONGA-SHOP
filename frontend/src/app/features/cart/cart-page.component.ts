import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartPromoService } from '../../core/services/cart-promo.service';
import { ProductService } from '../../core/services/product.service';
import { SaveForLaterService } from '../../core/services/save-for-later.service';
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
  private readonly promo = inject(CartPromoService);
  private readonly sfl = inject(SaveForLaterService);
  private readonly toasts = inject(ToastService);

  // One-time snapshot is enough for mock data.
  private _snapshot: Product[] | null = null;
  private productsSnapshot(): Product[] {
    if (this._snapshot) return this._snapshot;
    let out: Product[] = [];
    this.products.getProducts().subscribe((x) => (out = x)).unsubscribe();
    this._snapshot = out;
    return out;
  }

  readonly lines = computed<CartView[]>(() => {
    const list = this.productsSnapshot();
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
  readonly discount = computed(() => {
    const st = this.promo.state();
    if (!st.active) return 0;
    if (st.kind === 'pct') return (this.subtotal() * st.value) / 100;
    return 0;
  });

  readonly shipping = computed(() => (this.subtotal() - this.discount() > 59 ? 0 : this.lines().length ? 3.9 : 0));
  readonly total = computed(() => this.subtotal() - this.discount() + this.shipping());

  readonly promoCode = computed(() => this.promo.state().code);
  readonly promoActive = computed(() => this.promo.state().active);

  inc(l: CartView): void {
    const v = l.product.variants.find((x) => x.id === l.variantId);
    if (v && l.qty >= v.stock) {
      this.toasts.show('Llegaste al stock máximo.', 'warning', 'Carrito');
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

  saveForLater(l: CartView): void {
    this.cart.remove(l.product.id, l.variantId);
    this.sfl.add(l.product.id, l.variantId, l.qty);
    this.toasts.show('Guardado para después', 'info', 'Carrito');
  }

  setPromo(code: string): void {
    this.promo.setCode(code);
    const st = this.promo.state();
    if (st.active) this.toasts.show(`Cupón ${st.code} aplicado`, 'success', 'Cupón');
    else if (st.code) this.toasts.show('Cupón inválido', 'warning', 'Cupón');
  }

  clearPromo(): void {
    this.promo.clear();
    this.toasts.show('Cupón removido', 'info', 'Cupón');
  }
}

