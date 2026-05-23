export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  category?: string;
  description: string;
  image?: string;
  expiration_date?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export const ITEMS_PER_PAGE = 9;