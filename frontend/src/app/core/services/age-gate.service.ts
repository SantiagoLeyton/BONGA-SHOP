import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'bonga.age-gate.v1';
const MIN_AGE = 18;
const MAX_REASONABLE_AGE = 120;

export type AgeGateStatus = 'pending' | 'ok' | 'blocked';

interface StoredGate {
  status: 'ok' | 'blocked';
  at: string;
}

function safeRead(): StoredGate | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGate;
    if (parsed.status !== 'ok' && parsed.status !== 'blocked') return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(value: StoredGate | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!value) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  } catch {
    /* ignore */
  }
}

export function computeAge(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

@Injectable({ providedIn: 'root' })
export class AgeGateService {
  readonly minAge = MIN_AGE;
  readonly maxReasonableAge = MAX_REASONABLE_AGE;

  private readonly _status = signal<AgeGateStatus>(this.readInitial());
  readonly status = computed(() => this._status());
  readonly verified = computed(() => this._status() === 'ok');
  readonly needsGate = computed(() => this._status() === 'pending');
  readonly blocked = computed(() => this._status() === 'blocked');

  private readInitial(): AgeGateStatus {
    const stored = safeRead();
    return stored?.status ?? 'pending';
  }

  /** Verifica la edad a partir de una fecha en formato YYYY-MM-DD. */
  verifyFromDate(iso: string): { ok: boolean; age: number | null; reason?: string } {
    const parsed = this.parseDate(iso);
    if (!parsed) {
      return { ok: false, age: null, reason: 'invalid' };
    }
    const age = computeAge(parsed);
    if (age < 0 || age > MAX_REASONABLE_AGE) {
      return { ok: false, age, reason: 'unrealistic' };
    }
    if (age < MIN_AGE) {
      this._status.set('blocked');
      safeWrite({ status: 'blocked', at: new Date().toISOString() });
      return { ok: false, age, reason: 'underage' };
    }
    this._status.set('ok');
    safeWrite({ status: 'ok', at: new Date().toISOString() });
    return { ok: true, age };
  }

  reset(): void {
    this._status.set('pending');
    safeWrite(null);
  }

  /** Para poder cambiar de fecha si el usuario cometió un error y quedó bloqueado. */
  retry(): void {
    this._status.set('pending');
    safeWrite(null);
  }

  private parseDate(iso: string): Date | null {
    if (!iso) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return null;
    const [, y, m, d] = match;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    const nowYear = new Date().getFullYear();
    if (year < nowYear - MAX_REASONABLE_AGE || year > nowYear) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    if (date.getTime() > Date.now()) return null;
    return date;
  }
}
