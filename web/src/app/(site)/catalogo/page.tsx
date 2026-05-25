"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { gsap } from "gsap";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  badge?: string;
}

const categories = ["Todas", "despensa", "frescos", "lácteos", "limpieza"];

export default function CatalogoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("destacados");

  const headerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setErrorMsg("");
        
        const response = await api.getProducts() as any;
        const fetchedData = response.data || response || [];
        
        const mappedProducts = (Array.isArray(fetchedData) ? fetchedData : []).map((p: any) => ({
          id: p.id || p.product_id || String(Math.random()),
          name: p.name || p.title || "Producto",
          price: parseFloat(p.price || p.unit_price || 0),
          originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
          image: p.image || p.image_url || "",
          category: (p.category || "despensa").toLowerCase(),
          stock: parseInt(p.stock || p.stock_quantity || 0),
          rating: p.rating || 5.0,
          reviews: p.reviews || 0,
          description: p.description || "Sin descripción disponible.",
          badge: p.badge || undefined
        }));

        setProductsList(mappedProducts);
      } catch (err: any) {
        console.error("Error cargando productos en catálogo:", err);
        setErrorMsg(err.message || "Error al conectar con el microservicio de inventario.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [user]);

  useEffect(() => {
    if (loadingProducts || authLoading) return;

    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    if (controlsRef.current) {
      gsap.fromTo(controlsRef.current, 
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.2 }
      );
    }
  }, [loadingProducts, authLoading]);

  const filteredProducts = productsList.filter(p => {
    const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "precio-asc") return a.price - b.price;
    if (sortBy === "precio-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; 
  });

  if (authLoading || (user && loadingProducts)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-transparent">
        <div className="relative w-16 h-16 mb-4">
          <span className="material-symbols-outlined text-[48px] text-data-blue animate-spin">autorenew</span>
        </div>
        <p className="font-data-label text-xs tracking-widest text-slate-500 dark:text-slate-400 uppercase animate-pulse">
          {authLoading ? "AUTENTICANDO SESIÓN..." : "SINCRONIZANDO INVENTARIO CLOUD..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen pt-8 pb-20 bg-transparent flex-grow flex flex-col">
      <div className="w-full px-4 sm:px-6 md:px-margin-page">
        {/* Header Block - Brutalist Design */}
        <section ref={headerRef} className="relative w-full border-b border-slate-900 dark:border-white py-8 sm:py-12 mb-8 sm:mb-12">
          {/* Crosshairs */}
          <div className="crosshair-tl" />
          <div className="crosshair-tr" />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-data-label text-[9px] sm:text-[10px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 uppercase tracking-widest">
                ACTIVO: {user.role}
              </span>
              <span className="font-data-label text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
            <h1 className="font-headline-lg-mobile sm:font-headline-lg text-3xl sm:text-headline-lg text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
              CATÁLOGO<br className="sm:hidden" /> CONFIMAX
            </h1>
            <p className="font-body-md text-sm sm:text-body-md text-slate-600 dark:text-slate-400 max-w-2xl border-l-2 border-data-blue pl-4 bg-slate-100/50 dark:bg-surface-variant/30 p-4">
              Encuentra todo lo que necesitas para tu despensa y hogar. Productos garantizados y con precios justos.
            </p>
          </div>
        </section>

        {/* Error Block */}
        {errorMsg && (
          <div className="bg-error/10 border border-error p-4 sm:p-6 mb-8 sm:mb-12 flex items-start gap-4">
            <span className="material-symbols-outlined text-[24px] text-error mt-1">warning</span>
            <div>
              <h4 className="font-data-label text-sm uppercase text-error mb-2 tracking-widest">Error de sincronización</h4>
              <p className="font-body-md text-xs sm:text-sm text-slate-700 dark:text-red-200">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Controls Block - Brutalist */}
        <div ref={controlsRef} className="border border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 relative group transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900/20 dark:bg-white/20">
             <div className="h-full w-1/3 bg-data-blue" />
          </div>
          
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 items-start xl:items-center justify-between mt-2">
            
            {/* Search */}
            <div className="relative flex-1 w-full xl:max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500">search</span>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-surface-bright border border-slate-900 dark:border-white py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md min-h-[48px]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full xl:w-auto">
              <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none w-full bg-white dark:bg-surface-bright border border-slate-900 dark:border-white py-3 pl-10 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-data-label text-[11px] uppercase tracking-widest cursor-pointer min-h-[48px]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 pointer-events-none">filter_list</span>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 pointer-events-none">expand_more</span>
              </div>

              <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full bg-white dark:bg-surface-bright border border-slate-900 dark:border-white py-3 pl-4 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-data-label text-[11px] uppercase tracking-widest cursor-pointer min-h-[48px]"
                >
                  <option value="destacados">DESTACADOS</option>
                  <option value="precio-asc">PRECIO ASC</option>
                  <option value="precio-desc">PRECIO DESC</option>
                  <option value="rating">VALORADOS</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 pointer-events-none">expand_more</span>
              </div>

              {/* View Toggle */}
              <div className="flex bg-white dark:bg-surface-bright border border-slate-900 dark:border-white p-1 ml-auto sm:ml-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${viewMode === "grid" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  aria-label="Vista de cuadrícula"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${viewMode === "list" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  aria-label="Vista de lista"
                >
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900/20 dark:border-white/20">
          <h2 className="font-headline-lg-mobile text-slate-900 dark:text-white uppercase">
            {selectedCategory === "Todas" ? "INVENTARIO COMPLETO" : `C/ ${selectedCategory.toUpperCase()}`}
          </h2>
          <span className="font-data-label text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-900/20 dark:border-white/20 px-3 py-1">
            {filteredProducts.length} ITEMS
          </span>
        </div>

        {/* Products Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "flex flex-col gap-6"
        }>
          {filteredProducts.map((product) => (
            <div key={product.id} className="transition-transform duration-300 hover:-translate-y-1">
              <ProductCard product={product} viewMode={viewMode} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loadingProducts && (
          <div className="text-center py-20 border border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim mt-8 relative">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            <div className="crosshair-bl" />
            <div className="crosshair-br" />
            <span className="material-symbols-outlined text-[64px] text-slate-500 mb-6">inventory_2</span>
            <h3 className="font-headline-lg-mobile text-slate-900 dark:text-white mb-4 uppercase">NO ENCONTRADO</h3>
            <p className="font-body-md text-slate-600 dark:text-slate-400 max-w-md mx-auto bg-white/50 dark:bg-surface-bright/50 p-4 border border-slate-900/10 dark:border-white/10">
              No hay productos que coincidan con la búsqueda actual o los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
