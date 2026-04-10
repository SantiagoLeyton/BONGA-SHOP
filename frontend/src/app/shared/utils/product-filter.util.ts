import type { Product } from '../../core/models/product.model';

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';

export interface ProductFilterState {
  brandSlugs: string[];
  flavors: string[];
  nicotineMin: number | null;
  nicotineMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sort: ProductSort;
}

export function defaultFilterState(): ProductFilterState {
  return {
    brandSlugs: [],
    flavors: [],
    nicotineMin: null,
    nicotineMax: null,
    priceMin: null,
    priceMax: null,
    sort: 'featured',
  };
}

function minPrice(p: Product): number {
  return Math.min(...p.variants.map((v) => v.price));
}

/** Applies UI filters to the mock catalog (client-side). Replace with API query later. */
export function applyProductFilters(products: Product[], f: ProductFilterState): Product[] {
  let list = products.filter((p) => {
    if (f.brandSlugs.length && !f.brandSlugs.includes(p.brand.slug)) {
      return false;
    }
    if (f.flavors.length) {
      const ok = p.variants.some((v) => f.flavors.includes(v.flavor));
      if (!ok) {
        return false;
      }
    }
    if (f.nicotineMin != null) {
      const ok = p.variants.some((v) => v.nicotineMg >= f.nicotineMin!);
      if (!ok) {
        return false;
      }
    }
    if (f.nicotineMax != null) {
      const ok = p.variants.some((v) => v.nicotineMg <= f.nicotineMax!);
      if (!ok) {
        return false;
      }
    }
    if (f.priceMin != null && minPrice(p) < f.priceMin) {
      return false;
    }
    if (f.priceMax != null && minPrice(p) > f.priceMax) {
      return false;
    }
    return true;
  });

  list = [...list];

  switch (f.sort) {
    case 'price-asc':
      list.sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case 'price-desc':
      list.sort((a, b) => minPrice(b) - minPrice(a));
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.name.localeCompare(b.name));
      break;
  }

  return list;
}

export function uniqueFlavors(products: Product[]): string[] {
  const s = new Set<string>();
  products.forEach((p) => p.variants.forEach((v) => s.add(v.flavor)));
  return [...s].sort((a, b) => a.localeCompare(b));
}
