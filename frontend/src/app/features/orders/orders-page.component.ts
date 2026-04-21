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
  /** IDs de pedidos cerrados manualmente; por defecto todos estan abiertos. */
  private readonly collapsedIds = signal<Set<string>>(new Set());

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

  isExpanded(id: string): boolean {
    return !this.collapsedIds().has(id);
  }

  toggleExpanded(id: string): void {
    const current = this.collapsedIds();
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.collapsedIds.set(next);
  }

  statusLabel(status: Order['status']): string {
    switch (status) {
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'En camino';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      case 'created':
      default:
        return 'Creado';
    }
  }

  statusClass(status: Order['status']): string {
    return `pill pill--${status}`;
  }

  trackLine = (index: number, line: { variantId: string }): string => `${line.variantId}-${index}`;
}
