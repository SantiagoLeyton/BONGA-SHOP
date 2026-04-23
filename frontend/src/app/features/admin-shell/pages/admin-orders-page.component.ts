import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { OrderStatus } from '../../../core/models/order.model';
import { OrderService, type AdminOrderSummary } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [DatePipe, AppCurrencyPipe],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-pages.shared.scss',
})
export class AdminOrdersPageComponent {
  private readonly ordersService = inject(OrderService);
  private readonly toasts = inject(ToastService);

  readonly adminOrders = toSignal(this.ordersService.getAdminOrders(), { initialValue: [] });

  readonly statusFilter = signal<'all' | OrderStatus>('all');
  readonly userFilter = signal('');
  readonly orderStatusDrafts = signal<Record<string, OrderStatus>>({});
  readonly savingOrderId = signal<string | null>(null);

  readonly orderStatuses: OrderStatus[] = ['created', 'processing', 'shipped', 'delivered', 'cancelled'];

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const userId = this.userFilter().trim();
    return this.adminOrders().filter((order) => {
      if (status !== 'all' && order.status !== status) return false;
      if (userId && order.userId !== userId) return false;
      return true;
    });
  });

  statusValue(order: AdminOrderSummary): OrderStatus {
    return this.orderStatusDrafts()[order.id] ?? order.status;
  }

  setStatusDraft(orderId: string, value: string): void {
    this.orderStatusDrafts.update((drafts) => ({
      ...drafts,
      [orderId]: value as OrderStatus,
    }));
  }

  async saveOrderStatus(order: AdminOrderSummary): Promise<void> {
    this.savingOrderId.set(order.id);
    try {
      await this.ordersService.updateAdminOrderStatus(order.id, this.statusValue(order));
      this.orderStatusDrafts.update((drafts) => {
        const next = { ...drafts };
        delete next[order.id];
        return next;
      });
      this.toasts.show('Estado de orden actualizado.', 'success', 'Pedidos');
    } catch (error) {
      this.toasts.show(this.errorMessage(error, 'No se pudo actualizar la orden.'), 'danger', 'Pedidos');
    } finally {
      this.savingOrderId.set(null);
    }
  }

  setStatusFilter(v: string): void {
    this.statusFilter.set(v as 'all' | OrderStatus);
  }

  setUserFilter(v: string): void {
    this.userFilter.set(v);
  }

  statusLabel(status: OrderStatus): string {
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

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
