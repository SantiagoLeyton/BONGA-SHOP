import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AuthRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
}

type AuthResponse = {
  token: string;
  type?: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    role: string;
    active: boolean;
  };
};

const STORAGE_KEY = 'bonga.auth.v1';

type StoredAuth = {
  token: string;
  type: string;
  user: AuthUser;
};

function safeRead(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function safeWrite(next: StoredAuth | null): void {
  try {
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly stored = signal<StoredAuth | null>(safeRead());
  private readonly apiUrl = environment.apiUrl;

  readonly user = computed(() => this.stored()?.user ?? null);
  readonly token = computed(() => this.stored()?.token ?? null);
  readonly isAuthed = computed(() => Boolean(this.stored()?.token));

  constructor(private readonly http: HttpClient) {}

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }),
      );
      const next = this.normalizeAuthResponse(response);
      this.stored.set(next);
      safeWrite(next);
      return next.user;
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo iniciar sesi\u00f3n.');
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password }),
      );
      const next = this.normalizeAuthResponse(response);
      this.stored.set(next);
      safeWrite(next);
      return next.user;
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo completar el registro.');
    }
  }

  logout(): void {
    this.stored.set(null);
    safeWrite(null);
  }

  private normalizeAuthResponse(response: AuthResponse): StoredAuth {
    return {
      token: response.token,
      type: response.type ?? 'Bearer',
      user: {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'customer',
      },
    };
  }

  private mapHttpError(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse) {
      const message =
        (typeof error.error?.message === 'string' && error.error.message) ||
        (Array.isArray(error.error?.validationErrors) &&
          typeof error.error.validationErrors[0]?.message === 'string' &&
          error.error.validationErrors[0].message) ||
        fallback;
      return new Error(message);
    }

    return error instanceof Error ? error : new Error(fallback);
  }
}
