import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'bonga.wishlist.v1';

function safeRead(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function safeWrite(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage failures
  }
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly ids = signal<string[]>(safeRead());

  readonly count = computed(() => this.ids().length);

  list(): string[] {
    return this.ids();
  }

  has(productId: string): boolean {
    return this.ids().includes(productId);
  }

  toggle(productId: string): boolean {
    const next = new Set(this.ids());
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    const arr = [...next];
    this.ids.set(arr);
    safeWrite(arr);
    return next.has(productId);
  }

  clear(): void {
    this.ids.set([]);
    safeWrite([]);
  }
}

