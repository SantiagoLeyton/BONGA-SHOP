import { Injectable, computed, signal } from '@angular/core';

export type AppLang = 'es' | 'en';

const STORAGE_LANG = 'bonga.lang.v1';

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
  private readonly _lang = signal<AppLang>(this.normalizeLang(safeRead(STORAGE_LANG, 'es')));

  readonly lang = computed(() => this._lang());

  setLang(next: AppLang): void {
    const lang = this.normalizeLang(next);
    this._lang.set(lang);
    safeWrite(STORAGE_LANG, lang);
  }

  private normalizeLang(value: string): AppLang {
    return value === 'en' ? 'en' : 'es';
  }
}

