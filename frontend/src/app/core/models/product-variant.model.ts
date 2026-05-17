export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  flavor: string;
  nicotineMg: number;
  price: number;
  stock: number;
  active?: boolean;
  label?: string;
}
