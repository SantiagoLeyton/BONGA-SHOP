export interface InventorySnapshot {
  variantId: string;
  quantity: number;
  lowStockThreshold: number;
}

export interface InventoryRecord extends InventorySnapshot {
  productId: string;
  productName: string;
  brandName: string;
  flavor: string;
  nicotineLevel: string;
  stock: number;
  active: boolean;
  lowStock: boolean;
}
