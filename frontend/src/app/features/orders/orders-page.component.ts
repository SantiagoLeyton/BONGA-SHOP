import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import type { Product } from '../../core/models/product.model';
import type { Order } from '../../core/models/order.model';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

type OrderView = Order & { linesCount: number };

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  private readonly orders = inject(OrderService);
  private readonly products = inject(ProductService);

  private _snapshot: Product[] | null = null;
  private productsSnapshot(): Product[] {
    if (this._snapshot) return this._snapshot;
    let out: Product[] = [];
    this.products.getProducts().subscribe((x) => (out = x)).unsubscribe();
    this._snapshot = out;
    return out;
  }

  readonly list = computed<OrderView[]>(() =>
    this.orders
      .list()
      .map((o) => ({ ...o, linesCount: o.lines.reduce((s, l) => s + l.qty, 0) })),
  );

  orderTotal(o: Order): number {
    const byId = new Map(this.productsSnapshot().map((p) => [p.id, p]));
    return o.lines.reduce((sum, l) => {
      const p = byId.get(l.productId);
      const v = p?.variants.find((x) => x.id === l.variantId);
      return sum + (v?.price ?? 0) * l.qty;
    }, 0);
  }

  statusLabel(s: Order['status']): string {
    switch (s) {
      case 'paid':
        return 'Pagada';
      case 'shipped':
        return 'Enviada';
      case 'delivered':
        return 'Entregada';
      case 'cancelled':
        return 'Cancelada';
      case 'created':
      default:
        return 'Creada';
    }
  }
}

