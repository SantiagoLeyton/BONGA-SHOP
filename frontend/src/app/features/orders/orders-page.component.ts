import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
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
  readonly loading = signal(true);

  readonly list = computed<OrderView[]>(() =>
    this.orders.list().map((order) => ({
      ...order,
      linesCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    })),
  );

  constructor() {
    void this.orders.loadMyOrders().finally(() => this.loading.set(false));
  }

  orderTotal(order: Order): number {
    return order.total;
  }

  statusLabel(status: Order['status']): string {
    switch (status) {
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

  statusClass(status: Order['status']): string {
    return `pill pill--${status}`;
  }
}
