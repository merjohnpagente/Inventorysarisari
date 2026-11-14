export interface User { id: number; name: string; email: string }

export interface Category {
  id: number;
  category_name: string;
  description?: string | null;
  products_count?: number;
  created_at?: string;
}

export interface Product {
  id: number;
  category_id: number | string;
  product_name: string;
  product_image?: string | null;
  description?: string | null;
  purchase_price: number | string;
  selling_price: number | string;
  quantity: number;
  minimum_stock: number;
  created_at?: string;
  updated_at?: string;
  category?: Category;
}

export interface StockMovement {
  id: number;
  product_id: number;
  user_id?: number;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  remarks?: string | null;
  movement_date: string;
  product?: Product;
  user?: { name: string };
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

export interface Dashboard {
  total_products?: number;
  total_categories?: number;
  total_stock?: number;
  low_stock_count?: number;
  stock_overview?: { name: string; quantity: number }[];
  recent_products?: Product[];
  low_stock?: Product[];
  recently_updated?: Product[];
}

export type FormErrors = Record<string, string>;
