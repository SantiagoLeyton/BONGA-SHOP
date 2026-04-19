import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
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
  readonly productList = toSignal(this.products.getProducts(), { initialValue: [] });

  readonly list = computed<OrderView[]>(() =>
    this.orders
      .list()
      .map((o) => ({ ...o, linesCount: o.lines.reduce((sum, line) => sum + line.quantity, 0) })),
  );

  constructor() {
    void this.orders.loadMyOrders();
  }

  orderTotal(o: Order): number {
    return o.total;
  }

  statusLabel(s: Order['status']): string {
    switch (s) {
      case 'processing':
        return 'Procesando';
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

