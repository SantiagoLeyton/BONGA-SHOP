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
