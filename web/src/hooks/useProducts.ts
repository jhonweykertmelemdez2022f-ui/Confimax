/**
 * ============================================================
 * HOOK: useProducts
 * ============================================================
 * Hook personalizado para obtener productos del inventario
 * a través del API Gateway.
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  unitPrice: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  expirationDate?: string;
  imageUrl?: string;
  version: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export function useProducts(params?: { limit?: number; offset?: number; category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [params]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProducts(params) as any;
      setProducts(response.data || response.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: loadProducts };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProduct(id) as any;
      setProduct(response.data || response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar producto");
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  };

  return { product, loading, error, refetch: loadProduct };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCategories() as any;
      setCategories(response.data || response.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías");
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: loadCategories };
}

export function useProductSearch(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.searchProducts(query) as any;
      setProducts(response.data || response.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar productos");
      console.error("Error searching products:", err);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error };
}
