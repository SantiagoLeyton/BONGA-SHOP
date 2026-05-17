import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { TranslationService } from '../../core/services/translation.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type OrderView = Order & { linesCount: number };

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, TranslatePipe],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  private readonly orders = inject(OrderService);
  private readonly translations = inject(TranslationService);
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
        return this.translations.instant('processing');
      case 'shipped':
        return this.translations.instant('shipped');
      case 'delivered':
        return this.translations.instant('delivered');
      case 'cancelled':
        return this.translations.instant('cancelled');
      case 'created':
      default:
        return this.translations.instant('created');
    }
  }

  statusClass(status: Order['status']): string {
    return `pill pill--${status}`;
  }

  trackLine = (index: number, line: { variantId: string }): string => `${line.variantId}-${index}`;
}
