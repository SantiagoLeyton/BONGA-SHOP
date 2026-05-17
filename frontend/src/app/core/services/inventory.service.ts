import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  InventoryMovement,
  InventoryMovementPage,
  InventoryMovementType,
  InventoryRecord,
  InventorySnapshot,
} from '../models/inventory.model';

type InventoryApiResponse = {
  variantId: number;
  productId: number;
  productName: string;
  brandName: string;
  flavor: string;
  nicotineLevel: string;
  stock: number;
  active: boolean;
};

type InventoryUpdateRequest = {
  stock: number;
  reason?: string;
};

type InventoryMovementApiResponse = {
  id: number;
  createdAt: string;
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  type: InventoryMovementType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  userName: string;
  reason: string;
};

type InventoryMovementPageApiResponse = {
  content: InventoryMovementApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type InventoryFilters = {
  productId?: string;
  variantId?: string;
  lowStock?: boolean;
};

export type InventoryMovementFilters = {
  type?: InventoryMovementType | '';
  productId?: string;
  date?: string;
  page?: number;
  size?: number;
};

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  listInventory(filters: InventoryFilters = {}): Observable<InventoryRecord[]> {
    return this.refresh$.pipe(
      switchMap(() =>
        this.http
          .get<InventoryApiResponse[]>(`${environment.apiUrl}/inventory`, {
            params: {
              ...(filters.productId ? { productId: filters.productId } : {}),
              ...(filters.variantId ? { variantId: filters.variantId } : {}),
              ...(filters.lowStock ? { lowStock: 'true' } : {}),
            },
          })
          .pipe(
            map((items) => items.map((item) => this.toRecord(item))),
            catchError(() => of([] as InventoryRecord[])),
          ),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getSnapshotForVariant(variantId: string): Observable<InventorySnapshot | undefined> {
    return this.listInventory({ variantId }).pipe(
      map((items) =>
        items[0]
          ? {
              variantId: items[0].variantId,
              quantity: items[0].stock,
              lowStockThreshold: 5,
            }
          : undefined,
      ),
    );
  }

  async updateStock(variantId: string, stock: number, reason?: string): Promise<InventoryRecord> {
    try {
      const response = await firstValueFrom(
        this.http.put<InventoryApiResponse>(`${environment.apiUrl}/inventory/${variantId}`, {
          stock: Math.max(0, Math.floor(stock)),
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        } satisfies InventoryUpdateRequest),
      );
      this.refresh();
      return this.toRecord(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar el stock.');
    }
  }

  async listMovements(filters: InventoryMovementFilters = {}): Promise<InventoryMovementPage> {
    try {
      const response = await firstValueFrom(
        this.http.get<InventoryMovementPageApiResponse>(`${environment.apiUrl}/inventory/movements`, {
          params: {
            page: String(filters.page ?? 0),
            size: String(filters.size ?? 10),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.productId ? { productId: filters.productId } : {}),
            ...(filters.date ? { date: filters.date } : {}),
          },
        }),
      );
      return {
        ...response,
        content: response.content.map((item) => this.toMovement(item)),
      };
    } catch {
      return {
        content: [],
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        totalElements: 0,
        totalPages: 0,
      };
    }
  }

  refresh(): void {
    this.refresh$.next();
  }

  private toRecord(response: InventoryApiResponse): InventoryRecord {
    return {
      variantId: String(response.variantId),
      quantity: response.stock,
      lowStockThreshold: 5,
      productId: String(response.productId),
      productName: response.productName,
      brandName: response.brandName,
      flavor: response.flavor,
      nicotineLevel: response.nicotineLevel,
      stock: response.stock,
      active: response.active,
      lowStock: response.stock <= 5,
    };
  }

  private toMovement(response: InventoryMovementApiResponse): InventoryMovement {
    return {
      id: String(response.id),
      createdAt: response.createdAt,
      productId: String(response.productId),
      productName: response.productName,
      variantId: String(response.variantId),
      variantName: response.variantName,
      type: response.type,
      quantityChange: Number(response.quantityChange),
      stockBefore: Number(response.stockBefore),
      stockAfter: Number(response.stockAfter),
      userName: response.userName,
      reason: response.reason,
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
