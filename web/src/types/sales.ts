export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity?: number;
  stock: number;
}

export interface SaleItem {
  product_id: string;
  name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customer_id?: string;
  customer?: Customer;
  total_amount: number;
  items: SaleItem[];
  status: string;
  created_at: string;
  notes?: string;
}

export const formatPrice = (value: any): string => {
  const num = Number(value) || 0;
  return num.toFixed(2);
};