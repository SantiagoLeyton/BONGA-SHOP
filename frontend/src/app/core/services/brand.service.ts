import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Brand } from '../models/brand.model';

type BrandApiResponse = {
  id: number;
  name: string;
  active: boolean;
};

type BrandWriteRequest = {
  name: string;
};

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly brands$ = this.refresh$.pipe(
    switchMap(() =>
      this.http.get<BrandApiResponse[]>(`${environment.apiUrl}/brands`).pipe(
        map((brands) => brands.map((brand) => this.toBrand(brand))),
        catchError(() => of([] as Brand[])),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getBrands(): Observable<Brand[]> {
    return this.brands$;
  }

  async createBrand(name: string): Promise<Brand> {
    try {
      const response = await firstValueFrom(
        this.http.post<BrandApiResponse>(`${environment.apiUrl}/brands`, this.toWriteRequest(name)),
      );
      this.refresh();
      return this.toBrand(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo crear la marca.');
    }
  }

  async updateBrand(id: string, name: string): Promise<Brand> {
    try {
      const response = await firstValueFrom(
        this.http.put<BrandApiResponse>(`${environment.apiUrl}/brands/${id}`, this.toWriteRequest(name)),
      );
      this.refresh();
      return this.toBrand(response);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo actualizar la marca.');
    }
  }

  async deleteBrand(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/brands/${id}`));
      this.refresh();
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo eliminar la marca.');
    }
  }

  refresh(): void {
    this.refresh$.next();
  }

  private toWriteRequest(name: string): BrandWriteRequest {
    return {
      name: name.trim(),
    };
  }

  private toBrand(response: BrandApiResponse): Brand {
    return {
      id: String(response.id),
      name: response.name,
      slug: this.slugify(response.name),
      active: response.active,
    };
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
