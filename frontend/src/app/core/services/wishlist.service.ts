import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

type FavoriteApiResponse = {
  id: number;
  productId: number;
  productName: string;
  brandName: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly ids = signal<string[]>([]);

  readonly loaded = signal(false);
  readonly count = computed(() => this.ids().length);

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (!userId) {
        this.ids.set([]);
        this.loaded.set(true);
        return;
      }

      this.loaded.set(false);
      void this.load(userId).finally(() => {
        if (this.auth.user()?.id === userId) {
          this.loaded.set(true);
        }
      });
    }, { allowSignalWrites: true });
  }

  list(): string[] {
    return this.ids();
  }

  has(productId?: string | null): boolean {
    return typeof productId === 'string' && this.ids().includes(productId);
  }

  async refresh(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.ids.set([]);
      this.loaded.set(true);
      return;
    }

    this.loaded.set(false);
    try {
      await this.load(userId);
    } finally {
      if (this.auth.user()?.id === userId) {
        this.loaded.set(true);
      }
    }
  }

  async toggle(productId: string): Promise<boolean> {
    this.ensureAuthenticated();

    try {
      if (this.has(productId)) {
        await firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/favorites/${productId}`));
        this.ids.update((ids) => ids.filter((id) => id !== productId));
        return false;
      }

      const response = await firstValueFrom(
        this.http.post<FavoriteApiResponse>(`${environment.apiUrl}/favorites/${productId}`, {}),
      );
      const nextId = String(response.productId);
      this.ids.update((ids) => (ids.includes(nextId) ? ids : [...ids, nextId]));
      return true;
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar favoritos.');
    }
  }

  async clear(): Promise<void> {
    this.ensureAuthenticated();

    try {
      await firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/favorites`));
      this.ids.set([]);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudieron limpiar los favoritos.');
    }
  }

  private async load(userId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<FavoriteApiResponse[]>(`${environment.apiUrl}/favorites`));
      if (this.auth.user()?.id !== userId) {
        return;
      }
      this.ids.set(response.map((item) => String(item.productId)));
    } catch (error) {
      if (this.auth.user()?.id !== userId) {
        return;
      }
      this.ids.set([]);
      throw this.mapHttpError(error, 'No se pudieron cargar los favoritos.');
    }
  }

  private ensureAuthenticated(): void {
    if (!this.auth.isAuthed()) {
      throw new Error('AUTH_REQUIRED');
    }
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
