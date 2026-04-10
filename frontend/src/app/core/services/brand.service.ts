import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type { Brand } from '../models/brand.model';

function brandsFromCatalog(): Brand[] {
  const mapById = new Map<string, Brand>();
  MOCK_PRODUCTS.forEach((p) => mapById.set(p.brand.id, p.brand));
  return [...mapById.values()].sort((a, b) => a.name.localeCompare(b.name));
}

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly brands$ = new BehaviorSubject<Brand[]>(brandsFromCatalog());

  getBrands(): Observable<Brand[]> {
    return this.brands$.asObservable();
  }

  /** When the catalog switches to HTTP, map this method to the API */
  refreshFromCatalog(): void {
    this.brands$.next(brandsFromCatalog());
  }
}
