import type { CartLine } from '../services/cart.service';

export type OrderStatus = 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderAddress {
  name: string;
  email: string;
  phone: string;
  city: string;
  address1: string;
  notes?: string;
}

export interface Order {
  id: string;
  createdAt: string; // ISO
  status: OrderStatus;
  shipping: 'standard' | 'express';
  payment: 'cod' | 'card';
  address: OrderAddress;
  lines: CartLine[];
}

/** Prepared for future orders integration */
export interface OrderModel {
  id: string;
  status: string;
}
