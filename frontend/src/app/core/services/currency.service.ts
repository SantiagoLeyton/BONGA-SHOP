import { Injectable, computed, signal } from '@angular/core';

export type AppCurrency = 'COP' | 'USD';

const STORAGE_CUR = 'bonga.currency.v1';
const COP_TO_USD_RATE = 0.00025;

function safeRead(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly _currency = signal<AppCurrency>(this.normalize(safeRead(STORAGE_CUR, 'COP')));

  readonly currency = computed(() => this._currency());
  readonly copToUsdRate = COP_TO_USD_RATE;

  setCurrency(next: AppCurrency): void {
    const currency = this.normalize(next);
    this._currency.set(currency);
    safeWrite(STORAGE_CUR, currency);
  }

  toggleCurrency(): void {
    this.setCurrency(this._currency() === 'COP' ? 'USD' : 'COP');
  }

  convertFromCop(value: number): number {
    const normalized = Number.isFinite(value) ? value : 0;
    return this._currency() === 'USD' ? normalized * COP_TO_USD_RATE : normalized;
  }

  format(value: number): string {
    const currency = this._currency();
    const locale = currency === 'USD' ? 'en-US' : 'es-CO';
    const fractionDigits = currency === 'USD' ? 2 : 0;
    const converted = this.convertFromCop(value);

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(converted);
    } catch {
      return `${converted.toFixed(fractionDigits)} ${currency}`;
    }
  }

  private normalize(value: string): AppCurrency {
    return value === 'USD' ? 'USD' : 'COP';
  }
}
