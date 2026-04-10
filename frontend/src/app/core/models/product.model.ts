import type { Brand } from './brand.model';
import type { ProductVariant } from './product-variant.model';

export type ProductBadge = 'new' | 'popular' | 'low-stock';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: Brand;
  /** Path under /public, typically SVG */
  imageUrl: string;
  badge?: ProductBadge;
  featured?: boolean;
  variants: ProductVariant[];
}
