import { Injectable, computed, signal } from '@angular/core';

export type AppLang = 'es' | 'en';
export type AppCurrency = 'EUR' | 'COP' | 'USD';

const STORAGE_LANG = 'bonga.lang.v1';
const STORAGE_CUR = 'bonga.currency.v1';

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
export class AppSettingsService {
  private readonly _lang = signal<AppLang>((safeRead(STORAGE_LANG, 'es') as AppLang) || 'es');
  private readonly _currency = signal<AppCurrency>((safeRead(STORAGE_CUR, 'EUR') as AppCurrency) || 'EUR');

  readonly lang = computed(() => this._lang());
  readonly currency = computed(() => this._currency());

  setLang(next: AppLang): void {
    this._lang.set(next);
    safeWrite(STORAGE_LANG, next);
  }

  setCurrency(next: AppCurrency): void {
    this._currency.set(next);
    safeWrite(STORAGE_CUR, next);
  }
}

