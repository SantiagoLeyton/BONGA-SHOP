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
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
          email: email.trim().toLowerCase(),
          password,
        }),
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
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
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

  /**
   * Solicita un correo de restablecimiento. El backend siempre responde 202
   * aunque el correo no exista; aquí solo traducimos errores de red/validación.
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.apiUrl}/auth/password-reset/request`, {
          email: email.trim().toLowerCase(),
        }),
      );
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo iniciar la recuperación de contraseña.');
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.apiUrl}/auth/password-reset/confirm`, {
          token: token.trim(),
          newPassword,
        }),
      );
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo restablecer la contraseña.');
    }
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
      // Fallo de red (servidor apagado, CORS bloqueado, sin internet).
      if (error.status === 0) {
        return new Error(
          'No logramos conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
        );
      }

      const backendMessage =
        (typeof error.error?.message === 'string' && error.error.message) ||
        (Array.isArray(error.error?.validationErrors) &&
          typeof error.error.validationErrors[0]?.message === 'string' &&
          error.error.validationErrors[0].message) ||
        '';

      const translated = this.translateBackendMessage(backendMessage, error.status);
      if (translated) return new Error(translated);
      if (backendMessage) return new Error(backendMessage);
      return new Error(fallback);
    }

    return error instanceof Error ? error : new Error(fallback);
  }

  /**
   * Convierte los mensajes en inglés del backend a algo legible en español.
   * Si no reconoce el mensaje, devuelve `null` y se usa el original.
   */
  private translateBackendMessage(raw: string, status: number): string | null {
    const message = raw.toLowerCase();

    if (message.includes('invalid email or password')) {
      return 'Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.';
    }
    if (message.includes('inactive users cannot log in')) {
      return 'Tu cuenta está inactiva. Contacta soporte para reactivarla.';
    }
    if (message.includes('inactive users cannot reset')) {
      return 'Tu cuenta está inactiva. Contacta soporte para reactivarla antes de cambiar la contraseña.';
    }
    if (message.includes('email is already registered')) {
      return 'Ya existe una cuenta registrada con ese correo. Intenta iniciar sesión.';
    }
    if (message.includes('invalid or expired reset token')) {
      return 'El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.';
    }
    if (message.includes('password must be at least')) {
      return 'La nueva contraseña debe tener al menos 8 caracteres.';
    }
    if (status === 401) {
      return 'Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.';
    }
    if (status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (status >= 500) {
      return 'El servidor está teniendo problemas. Inténtalo en unos segundos.';
    }
    return null;
  }
}
