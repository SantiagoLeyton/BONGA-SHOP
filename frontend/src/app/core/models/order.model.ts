export type OrderStatus = 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderAddress {
  name: string;
  phone: string;
  city: string;
  address1: string;
  notes?: string;
}

export interface OrderLine {
  variantId: string;
  quantity: number;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  address: OrderAddress;
  lines: OrderLine[];
}
