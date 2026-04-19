import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartUiService } from '../../../core/services/cart-ui.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import type { Product } from '../../../core/models/product.model';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

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
  imports: [RouterLink, AppCurrencyPipe],
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

  readonly viewLines = computed<ViewLine[]>(() => {
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

  readonly subtotal = computed(() => this.viewLines().reduce((sum, l) => sum + l.lineTotal, 0));

  close(): void {
    this.ui.hide();
  }

  inc(line: ViewLine): void {
    const v = line.product.variants.find((x) => x.id === line.variantId);
    if (v && line.qty >= v.stock) {
      this.toasts.show('Llegaste al stock maximo.', 'warning', 'Carrito');
      return;
    }
    this.cart.add(line.product.id, line.variantId, 1);
  }

  dec(line: ViewLine): void {
    this.cart.setQty(line.product.id, line.variantId, line.qty - 1);
  }

  remove(line: ViewLine): void {
    this.cart.remove(line.product.id, line.variantId);
  }

  clear(): void {
    this.cart.clear();
  }

  changeVariant(line: ViewLine, nextVariantId: string): void {
    this.cart.changeVariant(line.product.id, line.variantId, nextVariantId);
  }
}
