/** Snapshot aligned with backend inventory for future integration */
export interface InventorySnapshot {
  variantId: string;
  quantity: number;
  lowStockThreshold: number;
}
