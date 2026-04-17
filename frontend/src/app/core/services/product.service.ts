import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly products$ = new BehaviorSubject<Product[]>(MOCK_PRODUCTS);

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  /** Replace product list (admin/mock). */
  setProducts(next: Product[]): void {
    this.products$.next([...next]);
  }

  /** Create or update a product (admin/mock). */
  upsertProduct(next: Product): void {
    const list = this.products$.value;
    const idx = list.findIndex((p) => p.id === next.id);
    if (idx >= 0) {
      const copy = [...list];
      copy[idx] = next;
      this.products$.next(copy);
      return;
    }
    this.products$.next([next, ...list]);
  }

  /** Delete a product by id (admin/mock). */
  deleteProduct(id: string): void {
    this.products$.next(this.products$.value.filter((p) => p.id !== id));
  }

  getProductBySlug(slug: string): Observable<Product | undefined> {
    if (!slug) {
      return of(undefined);
    }
    return this.products$.pipe(
      map((list) => list.find((p) => p.slug === slug)),
    );
  }

  /** Observable of featured products for landing sections */
  getFeaturedProducts(): Observable<Product[]> {
    return this.products$.pipe(
      map((list) => list.filter((p) => p.featured)),
    );
  }
}
