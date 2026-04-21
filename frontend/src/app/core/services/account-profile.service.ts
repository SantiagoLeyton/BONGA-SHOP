import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface AccountProfile {
  /** Nombre (obligatorio para envío) */
  name: string;
  /** Apellido (opcional) */
  lastName?: string;
  /** Correo (opcional, informativo) */
  email?: string;
  /** Teléfono (obligatorio) */
  phone: string;
  /** Ciudad (obligatoria) */
  city: string;
  /** Dirección principal (obligatoria) */
  address1: string;
  /** Notas de entrega (opcional) */
  notes?: string;
  /** Timestamp ISO del último guardado */
  updatedAt?: string;
}

const STORAGE_PREFIX = 'bonga.account-profile.v1';

function storageKey(userId: string | null | undefined): string {
  return userId ? `${STORAGE_PREFIX}.${userId}` : `${STORAGE_PREFIX}.guest`;
}

function safeRead(userId: string | null | undefined): AccountProfile | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccountProfile;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(userId: string | null | undefined, profile: AccountProfile | null): void {
  try {
    const key = storageKey(userId);
    if (!profile) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(profile));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

/**
 * Servicio de perfil de entrega del usuario.
 * - Persiste en localStorage por usuario (cae a "guest" si no hay sesión).
 * - Expone un signal reactivo que pueden leer otras páginas (ej. checkout).
 */
@Injectable({ providedIn: 'root' })
export class AccountProfileService {
  private readonly auth = inject(AuthService);

  private readonly state = signal<AccountProfile | null>(null);
  readonly profile = computed(() => this.state());
  readonly hasProfile = computed(() => {
    const p = this.state();
    return !!p && !!p.name && !!p.phone && !!p.city && !!p.address1;
  });

  constructor() {
    // Carga inicial y re-sincroniza cada vez que cambia el usuario autenticado.
    effect(
      () => {
        const userId = this.auth.user()?.id ?? null;
        this.state.set(safeRead(userId));
      },
      { allowSignalWrites: true },
    );
  }

  /** Guarda el perfil y lo persiste en localStorage para el usuario activo. */
  save(profile: AccountProfile): AccountProfile {
    const userId = this.auth.user()?.id ?? null;
    const next: AccountProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    this.state.set(next);
    safeWrite(userId, next);
    return next;
  }

  /** Elimina el perfil guardado (solo almacenamiento local). */
  clear(): void {
    const userId = this.auth.user()?.id ?? null;
    this.state.set(null);
    safeWrite(userId, null);
  }
}
