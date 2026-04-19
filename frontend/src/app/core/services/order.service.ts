import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Order, OrderStatus } from '../models/order.model';
import type { CartLine } from './cart.service';

type OrderSummaryApiResponse = {
  id: number;
  userId: number;
  customerName: string;
  status: string;
  total: number;
  placedAt: string;
};

type OrderDetailApiResponse = {
  id: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  placedAt: string;
  shippingRecipient: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  notes?: string;
  items: Array<{
    id: number;
    variantId: number;
    productName: string;
    variantDescription: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

type OrderPageApiResponse = {
  content: OrderSummaryApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export interface AdminOrderSummary {
  id: string;
  userId: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
}

export type CreateOrderInput = {
  items: CartLine[];
  shippingData: {
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
  };
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly list = signal<Order[]>([]);
  private readonly adminRefresh$ = new BehaviorSubject<void>(undefined);

  readonly adminOrders$ = this.adminRefresh$.pipe(
    switchMap(() =>
      this.http.get<OrderPageApiResponse>(`${environment.apiUrl}/orders`, { params: { page: 0, size: 100 } }).pipe(
        map((page) => page.content.map((item) => this.mapAdminSummary(item))),
        catchError(() => of([] as AdminOrderSummary[])),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(private readonly http: HttpClient) {}

  async loadMyOrders(): Promise<void> {
    const page = await firstValueFrom(
      this.http.get<OrderPageApiResponse>(`${environment.apiUrl}/orders/my-orders`, {
        params: { page: 0, size: 50 },
      }),
    );

    const orders = await Promise.all(
      page.content.map((order) =>
        firstValueFrom(this.http.get<OrderDetailApiResponse>(`${environment.apiUrl}/orders/${order.id}`)).then(
          (detail) => this.mapOrder(detail),
        ),
      ),
    );

    this.list.set(orders);
  }

  getAdminOrders(): Observable<AdminOrderSummary[]> {
    return this.adminOrders$;
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    try {
      const response = await firstValueFrom(
        this.http.post<OrderDetailApiResponse>(`${environment.apiUrl}/orders`, {
          items: input.items.map((item) => ({
            variantId: Number(item.variantId),
            quantity: item.qty,
          })),
          shippingData: input.shippingData,
        }),
      );

      const order = this.mapOrder(response);
      this.list.update((orders) => [order, ...orders.filter((item) => item.id !== order.id)]);
      this.refreshAdminOrders();
      return order;
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo crear la orden.');
    }
  }

  async updateAdminOrderStatus(id: string, status: OrderStatus): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch<OrderDetailApiResponse>(`${environment.apiUrl}/orders/${id}/status`, {
          status: status.toUpperCase(),
        }),
      );
      this.refreshAdminOrders();
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar el estado de la orden.');
    }
  }

  refreshAdminOrders(): void {
    this.adminRefresh$.next();
  }

  private mapOrder(response: OrderDetailApiResponse): Order {
    return {
      id: String(response.id),
      createdAt: response.placedAt,
      status: this.mapStatus(response.status),
      total: Number(response.total),
      address: {
        name: response.shippingRecipient,
        phone: response.shippingPhone,
        city: response.shippingCity,
        address1: response.shippingAddress,
        notes: response.notes,
      },
      lines: response.items.map((item) => ({
        variantId: String(item.variantId),
        quantity: item.quantity,
        productName: item.productName,
        variantDescription: item.variantDescription,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  private mapAdminSummary(response: OrderSummaryApiResponse): AdminOrderSummary {
    return {
      id: String(response.id),
      userId: String(response.userId),
      customerName: response.customerName,
      status: this.mapStatus(response.status),
      total: Number(response.total),
      placedAt: response.placedAt,
    };
  }

  private mapStatus(status: string): OrderStatus {
    switch (status?.toUpperCase()) {
      case 'PROCESSING':
        return 'processing';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      case 'CREATED':
      default:
        return 'created';
    }
  }

  private mapHttpError(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse) {
      const message =
        (typeof error.error?.message === 'string' && error.error.message) ||
        (Array.isArray(error.error?.validationErrors) &&
          typeof error.error.validationErrors[0]?.message === 'string' &&
          error.error.validationErrors[0].message) ||
        fallback;
      return new Error(message);
    }

    return error instanceof Error ? error : new Error(fallback);
  }
}
