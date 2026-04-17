import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Order } from '../models/order.model';

const STORAGE_KEY = 'bonga.orders.v1';

function safeRead(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Order[];
  } catch {
    return [];
  }
}

function safeWrite(next: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly orders = signal<Order[]>(safeRead());

  readonly list = computed(() => this.orders());

  constructor(private readonly http: HttpClient) {}

  add(order: Order): void {
    const next = [order, ...this.orders()];
    this.orders.set(next);
    safeWrite(next);
  }

  async createOrder(order: Order): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/orders`, order)
      );
    } catch (error) {
      console.log('Backend not available, saving locally');
      this.add(order);
    }
  }

  clear(): void {
    this.orders.set([]);
    safeWrite([]);
  }
}
