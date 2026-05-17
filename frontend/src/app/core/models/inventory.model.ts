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

export type InventoryMovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'ENTRY';

export interface InventoryMovement {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  type: InventoryMovementType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  userName: string;
  reason: string;
}

export interface InventoryMovementPage {
  content: InventoryMovement[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
