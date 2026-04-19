import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Product, ProductBadge } from '../models/product.model';
import type { ProductVariant } from '../models/product-variant.model';

type ProductListItemApiResponse = {
  id: number;
  name: string;
  description: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  hasStock: boolean;
};

type ProductListApiResponse = {
  content: ProductListItemApiResponse[];
};

type ProductDetailApiResponse = {
  id: number;
  name: string;
  description: string;
  active: boolean;
  brandId: number;
  brand: string;
  variants: ProductVariantApiResponse[];
};

type ProductVariantApiResponse = {
  id: number;
  productId: number;
  flavor: string;
  nicotineLevel: string;
  price: number;
  active: boolean;
  stock: number;
};

type ProductWriteRequest = {
  name: string;
  description: string;
  brandId: number;
  active: boolean;
};

type ProductVariantWriteRequest = {
  flavor: string;
  nicotineLevel: string;
  price: number;
  active: boolean;
};

type InventoryWriteRequest = {
  stock: number;
};

export type AdminProductVariantDraft = {
  id?: string;
  flavor: string;
  nicotineMg: number;
  price: number;
  stock: number;
  active: boolean;
};

export type AdminProductDraft = {
  id?: string;
  name: string;
  description: string;
  brandId: string;
  active: boolean;
  variants: AdminProductVariantDraft[];
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly products$ = this.refresh$.pipe(
    switchMap(() =>
      this.http
        .get<ProductListApiResponse>(`${environment.apiUrl}/products`, {
          params: { page: 0, size: 100 },
        })
        .pipe(
          switchMap((response) => {
            if (!response.content.length) {
              return of([] as Product[]);
            }

            return forkJoin(
              response.content.map((product, index) =>
                this.getProductDetail(product.id).pipe(map((detail) => this.toProduct(detail, index))),
              ),
            );
          }),
          catchError(() => of([] as Product[])),
        ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  getProductBySlug(slug: string): Observable<Product | undefined> {
    if (!slug) {
      return of(undefined);
    }

    return this.getProducts().pipe(map((list) => list.find((product) => product.slug === slug)));
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.getProducts().pipe(
      map((list) => {
        const featured = list.filter((product) => product.featured);
        return (featured.length ? featured : list).slice(0, 4);
      }),
    );
  }

  async upsertProduct(draft: AdminProductDraft): Promise<Product> {
    if (!draft.variants.length) {
      throw new Error('Debes registrar al menos una variante.');
    }

    try {
      const payload = this.toProductWriteRequest(draft);
      const baseResponse = draft.id
        ? await firstValueFrom(
            this.http.put<ProductDetailApiResponse>(`${environment.apiUrl}/products/${draft.id}`, payload),
          )
        : await firstValueFrom(this.http.post<ProductDetailApiResponse>(`${environment.apiUrl}/products`, payload));

      const productId = baseResponse.id;
      const existingVariants = new Map(baseResponse.variants.map((variant) => [String(variant.id), variant]));
      const draftIds = new Set(
        draft.variants
          .map((variant) => variant.id?.trim())
          .filter((value): value is string => Boolean(value)),
      );

      await Promise.all(
        draft.variants.map(async (variant) => {
          const response =
            variant.id && existingVariants.has(variant.id)
              ? await firstValueFrom(
                  this.http.put<ProductVariantApiResponse>(
                    `${environment.apiUrl}/variants/${variant.id}`,
                    this.toVariantWriteRequest(variant),
                  ),
                )
              : await firstValueFrom(
                  this.http.post<ProductVariantApiResponse>(
                    `${environment.apiUrl}/products/${productId}/variants`,
                    this.toVariantWriteRequest(variant),
                  ),
                );

          await firstValueFrom(
            this.http.put<void>(`${environment.apiUrl}/inventory/${response.id}`, {
              stock: Math.max(0, Math.floor(variant.stock)),
            } satisfies InventoryWriteRequest),
          );
        }),
      );

      await Promise.all(
        [...existingVariants.keys()]
          .filter((variantId) => !draftIds.has(variantId))
          .map((variantId) => firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/variants/${variantId}`))),
      );

      const finalProduct = await firstValueFrom(this.getProductDetail(productId));
      this.refresh();
      return this.toProduct(finalProduct, 0);
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo guardar el producto.');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${environment.apiUrl}/products/${id}`));
      this.refresh();
    } catch (error) {
      throw this.mapHttpError(error, 'No se pudo eliminar el producto.');
    }
  }

  refresh(): void {
    this.refresh$.next();
  }

  private getProductDetail(id: number): Observable<ProductDetailApiResponse> {
    return this.http.get<ProductDetailApiResponse>(`${environment.apiUrl}/products/${id}`);
  }

  private toProductWriteRequest(draft: AdminProductDraft): ProductWriteRequest {
    return {
      name: draft.name.trim(),
      description: draft.description.trim(),
      brandId: Number(draft.brandId),
      active: draft.active,
    };
  }

  private toVariantWriteRequest(variant: AdminProductVariantDraft): ProductVariantWriteRequest {
    return {
      flavor: variant.flavor.trim(),
      nicotineLevel: `${variant.nicotineMg} mg`,
      price: Number(variant.price),
      active: variant.active,
    };
  }

  private toProduct(response: ProductDetailApiResponse, index: number): Product {
    const slug = this.slugify(response.name);
    const variants = response.variants.map((variant) => this.toVariant(variant));
    const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

    return {
      id: String(response.id),
      name: response.name,
      slug,
      description: response.description,
      brand: {
        id: String(response.brandId),
        name: response.brand,
        slug: this.slugify(response.brand),
        active: true,
      },
      imageUrl: `/assets/products/${slug}.svg`,
      badge: this.resolveBadge(totalStock, index),
      featured: index < 4,
      active: response.active,
      variants,
    };
  }

  private toVariant(variant: ProductVariantApiResponse): ProductVariant {
    const nicotineMg = this.parseNicotineLevel(variant.nicotineLevel);
    return {
      id: String(variant.id),
      productId: String(variant.productId),
      sku: `variant-${variant.id}`,
      flavor: variant.flavor,
      nicotineMg,
      price: Number(variant.price),
      stock: variant.stock,
      active: variant.active,
      label: `${variant.flavor} · ${nicotineMg} mg`,
    };
  }

  private parseNicotineLevel(value: string): number {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }

  private resolveBadge(totalStock: number, index: number): ProductBadge | undefined {
    if (totalStock > 0 && totalStock <= 5) {
      return 'low-stock';
    }
    if (index < 2) {
      return 'popular';
    }
    if (index < 4) {
      return 'new';
    }
    return undefined;
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
