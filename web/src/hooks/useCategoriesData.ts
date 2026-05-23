import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Category } from "@/types/categories";

export function useCategoriesData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories() as any;
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      setCategories(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  return {
    categories,
    setCategories,
    loading,
    errorMsg,
    successMsg,
    loadCategories,
    showSuccess,
    showError
  };
}