import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MOCK_PRODUCTS } from '../data/mock-products';
import type { InventorySnapshot } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  /** Mock inventory aligned with product variants */
  getSnapshotForVariant(variantId: string): Observable<InventorySnapshot | undefined> {
    for (const p of MOCK_PRODUCTS) {
      const v = p.variants.find((x) => x.id === variantId);
      if (v) {
        return of({
          variantId: v.id,
          quantity: v.stock,
          lowStockThreshold: 5,
        });
      }
    }
    return of(undefined);
  }
}
