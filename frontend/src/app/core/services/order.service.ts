import { Injectable, computed, signal } from '@angular/core';
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

  add(order: Order): void {
    const next = [order, ...this.orders()];
    this.orders.set(next);
    safeWrite(next);
  }

  clear(): void {
    this.orders.set([]);
    safeWrite([]);
  }
}
