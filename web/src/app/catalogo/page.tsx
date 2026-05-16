"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, Grid3X3, List, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
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

const products: Product[] = [];

const categories = ["Todas", "despensa", "frescos", "lácteos", "limpieza"];

export default function CatalogoPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("destacados");
  const headerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animación de entrada del header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animación de los controles
    if (controlsRef.current) {
      gsap.fromTo(controlsRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.3 }
      );
    }
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "precio-asc") return a.price - b.price;
    if (sortBy === "precio-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const getStockColor = (stock: number) => {
    if (stock <= 10) return "text-error border-error";
    if (stock <= 30) return "text-slate-500 border-slate-500";
    return "text-[#00FF66] border-[#00FF66]";
  };

  return (
    <main className="min-h-screen pt-8 pb-20 bg-white dark:bg-background">
      <div className="w-full px-margin-page">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-2 uppercase">Mercado Confimax</h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">Compra alimentos, frescos, despensa y limpieza con precios pensados para el día a día.</p>
        </div>

        {/* Controls */}
        <div ref={controlsRef} className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md"
              />
            </div>

            {/* Filters & View */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-data-blue font-data-label font-data-label uppercase"
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
                className="bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-data-blue font-data-label font-data-label uppercase"
              >
                <option value="destacados">Destacados</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Valorados</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white p-1">
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
        <p className="font-data-label text-data-label text-slate-500 dark:text-slate-400 text-sm mb-6">
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
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white mb-2 uppercase">No hay productos disponibles</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 mb-6">No encontramos productos con esos filtros.</p>
          </div>
        )}
      </div>
    </main>
  );
}
