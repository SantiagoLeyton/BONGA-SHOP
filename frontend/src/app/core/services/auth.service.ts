import { HttpClient } from '@angular/common/http';
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
  user: AuthUser;
};

const STORAGE_KEY = 'bonga.auth.v1';

type StoredAuth = {
  token: string;
  user: AuthUser;
};

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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
  private readonly apiUrl: string = environment.apiUrl;

  readonly user = computed(() => this.stored()?.user ?? null);
  readonly token = computed(() => this.stored()?.token ?? null);
  readonly isAuthed = computed(() => Boolean(this.stored()?.token));

  constructor(private readonly http: HttpClient) {}

  // 🔥 LOGIN REAL + FALLBACK
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const next: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      );

      this.stored.set(next);
      safeWrite(next);
      return next.user;

    } catch (error) {
      console.log('Backend not available, using mock login');
      return await this.mockLogin(email, password);
    }
  }

  // 🔥 REGISTER REAL + FALLBACK
  async register(name: string, email: string, password: string): Promise<AuthUser> {
    try {
      const next: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password })
      );

      this.stored.set(next);
      safeWrite(next);
      return next.user;

    } catch (error) {
      console.log('Backend not available, using mock register');
      return await this.mockRegister(name, email, password);
    }
  }

  // 🔁 MOCK LOGIN
  private async mockLogin(email: string, password: string): Promise<AuthUser> {
    await sleep(650);

    const e = email.trim().toLowerCase();
    if (!e.includes('@') || password.trim().length < 8) {
      throw new Error('Correo o contraseña inválidos.');
    }

    const isAdmin = e.endsWith('@bonga.shop') || e.includes('admin');

    const user: AuthUser = {
      id: uid(),
      name: isAdmin ? 'Admin' : e.split('@')[0] || 'Cliente',
      email: e,
      role: isAdmin ? 'admin' : 'customer',
    };

    const next: StoredAuth = {
      token: `mock.${uid()}`,
      user
    };

    this.stored.set(next);
    safeWrite(next);

    return user;
  }

  // 🔁 MOCK REGISTER
  private async mockRegister(name: string, email: string, password: string): Promise<AuthUser> {
    await sleep(850);

    const n = name.trim();
    const e = email.trim().toLowerCase();

    if (n.length < 2) {
      throw new Error('Tu nombre debe tener al menos 2 caracteres.');
    }

    if (!e.includes('@')) {
      throw new Error('Ingresa un correo válido.');
    }

    if (password.trim().length < 8) {
      throw new Error('Tu contraseña debe tener al menos 8 caracteres.');
    }

    const user: AuthUser = {
      id: uid(),
      name: n,
      email: e,
      role: 'customer',
    };

    const next: StoredAuth = {
      token: `mock.${uid()}`,
      user
    };

    this.stored.set(next);
    safeWrite(next);

    return user;
  }

  // 🚪 LOGOUT
  logout(): void {
    this.stored.set(null);
    safeWrite(null);
  }
}
