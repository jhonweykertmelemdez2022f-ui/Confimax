"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Grid3X3, List, Package, RefreshCw, AlertTriangle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { gsap } from "gsap";

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

  // 1. Proteger ruta: Redirigir a Login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // 2. Cargar productos desde el Microservicio de Inventario
  useEffect(() => {
    if (!user) return; // Esperar a que esté autenticado

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setErrorMsg("");
        
        const response = await api.getProducts() as any;
        const fetchedData = response.data || response || [];
        
        // Mapear el formato PostgreSQL (unit_price, stock_quantity) al formato del frontend
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

  // 3. Ejecutar animaciones estéticas al cargar
  useEffect(() => {
    if (loadingProducts || authLoading) return;

    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    if (controlsRef.current) {
      gsap.fromTo(controlsRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.2 }
      );
    }
  }, [loadingProducts, authLoading]);

  // 4. Filtrar y Ordenar productos reactivamente
  const filteredProducts = productsList.filter(p => {
    const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "precio-asc") return a.price - b.price;
    if (sortBy === "precio-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // Default destacados / orden natural
  });

  // Pantalla de carga técnica ultra premium
  if (authLoading || (user && loadingProducts)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-background">
        <div className="relative w-16 h-16 mb-4">
          <RefreshCw className="w-12 h-12 text-data-blue animate-spin absolute top-2 left-2" />
          <div className="w-16 h-16 border-2 border-slate-900/10 dark:border-white/10 rounded-full" />
        </div>
        <p className="font-data-label text-xs tracking-widest text-slate-500 dark:text-slate-400 uppercase animate-pulse">
          {authLoading ? "AUTENTICANDO SESIÓN..." : "SINCRONIZANDO INVENTARIO CLOUD..."}
        </p>
      </div>
    );
  }

  // Redirigiendo...
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen pt-8 pb-20 bg-white dark:bg-background">
      <div className="w-full px-margin-page">
        {/* Header */}
        <div ref={headerRef} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-data-label text-[10px] bg-data-blue/10 text-data-blue px-2 py-0.5 border border-data-blue/30 uppercase">
                Sesión Activa: {user.role}
              </span>
              <span className="font-data-label text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                {user.email}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white uppercase">Mercado Confimax</h1>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">Compra alimentos, frescos, despensa y limpieza con precios pensados para el día a día.</p>
          </div>
        </div>

        {/* Error de Conexión */}
        {errorMsg && (
          <div className="bg-error/10 border border-error p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-data-label text-xs uppercase text-error mb-1">Error de sincronización</h4>
              <p className="font-body-sm text-xs text-slate-600 dark:text-slate-400">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div ref={controlsRef} className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar en el catálogo de productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md"
              />
            </div>

            {/* Filters & View */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-data-blue font-data-label uppercase"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-data-blue font-data-label uppercase"
              >
                <option value="destacados">Destacados</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Valorados</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white p-1 ml-auto lg:ml-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-slate-900 dark:bg-white text-white dark:text-background" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  aria-label="Vista de cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-slate-900 dark:bg-white text-white dark:text-background" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  aria-label="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="font-data-label text-slate-500 dark:text-slate-400 text-sm mb-6">
          {filteredProducts.length} PRODUCTOS ENCONTRADOS
        </p>

        {/* Products Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loadingProducts && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="font-headline-lg-mobile text-slate-900 dark:text-white mb-2 uppercase">No hay productos disponibles</h3>
            <p className="font-body-md text-slate-600 dark:text-slate-400 mb-6">No encontramos productos en stock bajo estos filtros.</p>
          </div>
        )}
      </div>
    </main>
  );
}
