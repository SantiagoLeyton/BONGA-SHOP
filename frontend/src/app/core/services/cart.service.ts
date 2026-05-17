import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

type CartApiResponse = {
  id: number;
  userId: number;
  status: string;
  convertedOrderId: number | null;
  totalItems: number;
  totalAmount: number;
  updatedAt: string;
  items: Array<{
    id: number;
    variantId: number;
    productId: number;
    productName: string;
    brandName: string;
    flavor: string;
    nicotineLevel: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly state = signal<CartApiResponse | null>(null);

  readonly loaded = signal(false);
  readonly count = computed(() => this.state()?.totalItems ?? 0);
  readonly items = computed<CartLine[]>(() =>
    (this.state()?.items ?? []).map((item) => ({
      productId: String(item.productId),
      variantId: String(item.variantId),
      qty: item.quantity,
    })),
  );

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (!userId) {
        this.state.set(null);
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

  async refresh(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.state.set(null);
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

  async add(_productId: string, variantId: string, qty = 1): Promise<void> {
    this.ensureAuthenticated();

    try {
      const response = await firstValueFrom(
        this.http.post<CartApiResponse>(`${environment.apiUrl}/cart/items`, {
          variantId: Number(variantId),
          quantity: Math.max(1, Math.floor(qty)),
        }),
      );
      this.state.set(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar el carrito.');
    }
  }

  async changeVariant(_productId: string, fromVariantId: string, toVariantId: string): Promise<void> {
    this.ensureAuthenticated();
    if (fromVariantId === toVariantId) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.patch<CartApiResponse>(`${environment.apiUrl}/cart/items/${fromVariantId}/variant`, {
          variantId: Number(toVariantId),
        }),
      );
      this.state.set(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo cambiar la variante del carrito.');
    }
  }

  async setQty(_productId: string, variantId: string, qty: number): Promise<void> {
    this.ensureAuthenticated();
    const normalized = Math.floor(qty);

    if (normalized <= 0) {
      return this.remove('', variantId);
    }

    try {
      const response = await firstValueFrom(
        this.http.put<CartApiResponse>(`${environment.apiUrl}/cart/items/${variantId}`, {
          quantity: normalized,
        }),
      );
      this.state.set(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar la cantidad del carrito.');
    }
  }

  async remove(_productId: string, variantId: string): Promise<void> {
    this.ensureAuthenticated();

    try {
      const response = await firstValueFrom(
        this.http.delete<CartApiResponse>(`${environment.apiUrl}/cart/items/${variantId}`),
      );
      this.state.set(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo quitar el item del carrito.');
    }
  }

  async clear(): Promise<void> {
    this.ensureAuthenticated();

    try {
      const response = await firstValueFrom(this.http.delete<CartApiResponse>(`${environment.apiUrl}/cart/items`));
      this.state.set(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo vaciar el carrito.');
    }
  }

  private async load(userId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<CartApiResponse>(`${environment.apiUrl}/cart`));
      if (this.auth.user()?.id !== userId) {
        return;
      }
      this.state.set(response);
    } catch (error) {
      if (this.auth.user()?.id !== userId) {
        return;
      }
      this.state.set(null);
      throw this.mapHttpError(error, 'No se pudo cargar el carrito.');
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
