"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { Package, Hash, Tag, ShoppingCart } from "lucide-react";

const currencySymbols: Record<string, string> = {
  USD: "$",
  VES: "Bs.",
  COP: "COP",
};

function formatCurrency(value: any, currency = "USD") {
  const amount = Number(value || 0);
  const symbol = currencySymbols[currency] ?? currency;
  return `${symbol} ${isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

export default function ProductDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const loadProduct = async () => {
      const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;
      if (!productId) return;
      setLoading(true);
      setError("");
      try {
        const data = await api.getProduct(productId);
        setProduct(data);
      } catch (err: any) {
        console.error("Error cargando producto:", err);
        setError(err?.message || "No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params?.id]);

  const currency = product?.currency || product?.currency_code || "USD";
  const currencySymbol = currencySymbols[currency] || "$";

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id || product.product_id,
      name: product.name || product.title || "Producto",
      price: Number(product.price || product.unit_price || 0),
      image: product.image || product.image_url || "",
      category: product.category || "general",
    }, quantity);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4" />
          <p className="text-sm uppercase tracking-widest text-slate-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-error uppercase tracking-widest">{error || "Producto no encontrado."}</p>
        <Link href="/catalogo" className="btn-precision">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 md:px-margin-page bg-transparent">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 text-slate-900 dark:text-white">
          <div>
            <p className="font-data-label text-xs uppercase tracking-widest text-data-blue">Catálogo Confimax</p>
            <h1 className="font-headline-lg-mobile text-3xl uppercase tracking-tight mt-2">Detalle del producto</h1>
          </div>
          <Link href="/catalogo" className="text-xs uppercase tracking-widest border border-slate-900 dark:border-white px-4 py-3 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
            Volver al catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-8 bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 shadow-lg">
          <div className="space-y-4">
            <div className="relative h-80 overflow-hidden bg-slate-100 dark:bg-[#111] rounded-lg">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <Package className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="border border-slate-900/10 dark:border-white/10 rounded-lg p-4">
              <p className="font-data-label text-[10px] uppercase tracking-widest text-slate-500">SKU</p>
              <p className="mt-2 font-headline-lg-mobile text-base uppercase text-slate-900 dark:text-white">{product.sku || product.product_id || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-data-label text-xs uppercase tracking-widest text-slate-500">{product.category || 'General'}</span>
                    <h2 className="font-headline-lg-mobile text-4xl uppercase tracking-tight mt-2">{product.name || 'Producto'}</h2>
                  </div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(product.price || product.unit_price, currency)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-900/10 dark:border-white/10 rounded-lg">
                    <p className="font-data-label text-[10px] uppercase tracking-widest text-slate-500">Disponibilidad</p>
                    <p className="mt-2 font-bold text-slate-900 dark:text-white">{product.stock_quantity ?? product.stock ?? 0} unidades</p>
                  </div>
                  <div className="p-4 border border-slate-900/10 dark:border-white/10 rounded-lg">
                    <p className="font-data-label text-[10px] uppercase tracking-widest text-slate-500">Moneda</p>
                    <p className="mt-2 font-bold text-slate-900 dark:text-white">{currencySymbol} {currency}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-data-label text-[10px] uppercase tracking-widest text-slate-500">Descripción</p>
                <p className="text-slate-700 dark:text-slate-300 leading-7">{product.description || 'Sin descripción disponible.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[120px_minmax(0,1fr)] gap-4 items-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white uppercase"
                >
                  -
                </button>
                <span className="min-w-[40px] text-center text-lg font-bold text-slate-900 dark:text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white uppercase"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 uppercase tracking-widest font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
              >
                <ShoppingCart className="inline-block mr-2" size={18} /> Añadir al carrito
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-900/10 dark:border-white/10 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-data-label text-[10px]">
                  <Hash size={16} /> SKU
                </div>
                <p className="mt-2 text-slate-900 dark:text-white">{product.sku || product.product_id || 'N/A'}</p>
              </div>
              <div className="p-4 border border-slate-900/10 dark:border-white/10 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-data-label text-[10px]">
                  <Tag size={16} /> Categoría
                </div>
                <p className="mt-2 text-slate-900 dark:text-white">{product.category || 'General'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
