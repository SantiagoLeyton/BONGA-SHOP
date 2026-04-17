import { Injectable, computed, signal } from '@angular/core';

export type PromoState =
  | { active: false; code: string }
  | { active: true; code: string; kind: 'pct'; value: number };

const STORAGE_KEY = 'bonga.cart.promo.v1';

function safeRead(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function safeWrite(code: string): void {
  try {
    if (!code) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class CartPromoService {
  private readonly code = signal(safeRead());

  readonly state = computed<PromoState>(() => {
    const raw = this.code().trim().toUpperCase();
    if (!raw) return { active: false, code: '' };
    if (raw === 'BONGA10') return { active: true, code: raw, kind: 'pct', value: 10 };
    if (raw === 'FREETEST') return { active: true, code: raw, kind: 'pct', value: 100 };
    return { active: false, code: raw };
  });

  setCode(next: string): void {
    this.code.set(next);
    safeWrite(next);
  }

  clear(): void {
    this.setCode('');
  }
}

