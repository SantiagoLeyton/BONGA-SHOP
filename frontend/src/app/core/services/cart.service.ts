import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

const STORAGE_KEY = 'bonga.cart.v1';

function safeRead(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => x as Partial<CartLine>)
      .filter((x) => typeof x.productId === 'string' && typeof x.variantId === 'string' && typeof x.qty === 'number')
      .map((x) => ({ productId: x.productId as string, variantId: x.variantId as string, qty: x.qty as number }))
      .filter((x) => x.qty > 0);
  } catch {
    return [];
  }
}

function safeWrite(lines: CartLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore storage failures
  }
}

function keyOf(l: Pick<CartLine, 'productId' | 'variantId'>): string {
  return `${l.productId}::${l.variantId}`;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly lines = signal<CartLine[]>(safeRead());

  readonly count = computed(() => this.lines().reduce((sum, l) => sum + l.qty, 0));
  readonly items = computed(() => this.lines());

  add(productId: string, variantId: string, qty = 1): void {
    const q = Math.max(1, Math.floor(qty));
    const next = new Map<string, CartLine>();
    for (const l of this.lines()) next.set(keyOf(l), { ...l });

    const k = keyOf({ productId, variantId });
    const prev = next.get(k);
    next.set(k, { productId, variantId, qty: (prev?.qty ?? 0) + q });

    const arr = [...next.values()];
    this.lines.set(arr);
    safeWrite(arr);
  }

  changeVariant(productId: string, fromVariantId: string, toVariantId: string): void {
    if (fromVariantId === toVariantId) return;
    const all = this.lines();
    const from = all.find((l) => l.productId === productId && l.variantId === fromVariantId);
    if (!from) return;
    const remaining = all.filter((l) => !(l.productId === productId && l.variantId === fromVariantId));
    const existing = remaining.find((l) => l.productId === productId && l.variantId === toVariantId);
    const merged = existing
      ? remaining.map((l) =>
          l.productId === productId && l.variantId === toVariantId ? { ...l, qty: l.qty + from.qty } : l,
        )
      : [...remaining, { productId, variantId: toVariantId, qty: from.qty }];
    this.lines.set(merged);
    safeWrite(merged);
  }

  setQty(productId: string, variantId: string, qty: number): void {
    const q = Math.max(0, Math.floor(qty));
    const arr = this.lines()
      .map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty: q } : l))
      .filter((l) => l.qty > 0);
    this.lines.set(arr);
    safeWrite(arr);
  }

  remove(productId: string, variantId: string): void {
    const arr = this.lines().filter((l) => !(l.productId === productId && l.variantId === variantId));
    this.lines.set(arr);
    safeWrite(arr);
  }

  clear(): void {
    this.lines.set([]);
    safeWrite([]);
  }
}

