import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Product, Category } from "@/types/inventory";

export function useInventoryData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const prodRes = await api.getProducts().catch(() => ({ data: [] }));
      let catData: any[] = [];
      
      try {
        const catRes = await api.getCategories().catch(() => ({ data: [] }));
        catData = Array.isArray((catRes as any).data || catRes) ? ((catRes as any).data || catRes) : [];
      } catch (catErr) {
        console.warn('No se pudieron cargar las categorías:', catErr);
        catData = [];
      }
      
      const prodData = Array.isArray((prodRes as any).data || prodRes) ? ((prodRes as any).data || prodRes) : [];
      
      const mappedProducts = prodData.map((p: any) => ({
        id: p.id || p.product_id,
        sku: p.sku,
        name: p.name,
        price: parseFloat(p.price || 0),
        stock: parseInt(p.stock || p.stock_quantity || 0),
        category_id: p.category_id,
        category: catData.find((c: any) => c.id === p.category_id)?.name || p.category || "Desconocida",
        description: p.description || "",
        image: p.image_url || p.image,
        expiration_date: p.expiration_date
      }));
      
      setAllProducts(mappedProducts);
      setProducts(mappedProducts);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  return {
    products,
    setProducts,
    allProducts,
    setAllProducts,
    categories,
    loading,
    errorMsg,
    successMsg,
    loadAllData,
    showSuccess,
    showError
  };
}