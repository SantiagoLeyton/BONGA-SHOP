import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title?: string;
  message: string;
  createdAt: number;
}

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, tone: ToastTone = 'info', title?: string, ttlMs = 2600): string {
    const id = uid();
    const item: ToastItem = { id, tone, title, message, createdAt: Date.now() };
    this.toasts.update((list) => [item, ...list].slice(0, 5));

    window.setTimeout(() => this.dismiss(id), ttlMs);
    return id;
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}

