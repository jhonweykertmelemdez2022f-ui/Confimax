"use client";

import { useState } from "react";
import { Search, Filter, Grid3X3, List, Star, Package, Tag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";

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

const products: Product[] = [
  { id: "1", name: "Sensor Industrial Pro", price: 299.99, originalPrice: 349.99, image: "/placeholder.svg", category: "tecnologia", stock: 45, rating: 4.8, reviews: 128, description: "Sensor industrial de alta precisión para monitoreo de procesos automatizados.", badge: "Oferta" },
  { id: "2", name: "Kit Herramientas Premium", price: 189.50, image: "/placeholder.svg", category: "herramientas", stock: 8, rating: 4.6, reviews: 89, description: "Kit completo de herramientas profesionales para mantenimiento industrial.", badge: "Bajo Stock" },
  { id: "3", name: "Panel de Control IoT", price: 459.00, image: "/placeholder.svg", category: "tecnologia", stock: 23, rating: 4.9, reviews: 156, description: "Panel de control inteligente con conectividad IoT para gestión remota." },
  { id: "4", name: "Escritorio Ergonómico", price: 599.99, image: "/placeholder.svg", category: "oficina", stock: 12, rating: 4.7, reviews: 203, description: "Escritorio ergonómico ajustable en altura para máxima comodidad.", badge: "Nuevo" },
  { id: "5", name: "Compresor Industrial 5HP", price: 1299.00, image: "/placeholder.svg", category: "industrial", stock: 5, rating: 4.9, reviews: 67, description: "Compresor de aire industrial de 5HP para aplicaciones pesadas.", badge: "Popular" },
  { id: "6", name: "Silla Ejecutiva Mesh", price: 349.99, originalPrice: 429.99, image: "/placeholder.svg", category: "oficina", stock: 31, rating: 4.5, reviews: 145, description: "Silla ejecutiva con malla transpirable y soporte lumbar ajustable.", badge: "Oferta" },
  { id: "7", name: "Multímetro Digital Avanzado", price: 89.99, image: "/placeholder.svg", category: "herramientas", stock: 67, rating: 4.4, reviews: 234, description: "Multímetro digital con múltiples funciones para diagnóstico eléctrico." },
  { id: "8", name: "Router Industrial 5G", price: 799.00, image: "/placeholder.svg", category: "tecnologia", stock: 15, rating: 4.8, reviews: 98, description: "Router industrial con conectividad 5G para redes críticas.", badge: "Nuevo" },
];

const categories = ["Todas", "tecnologia", "industrial", "oficina", "herramientas"];

export default function CatalogoPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("destacados");

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
    if (stock <= 10) return "text-red-400 bg-red-400/10";
    if (stock <= 30) return "text-yellow-400 bg-yellow-400/10";
    return "text-green-400 bg-green-400/10";
  };

  return (
    <main className="min-h-screen pt-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Catálogo de Productos</h1>
          <p className="text-slate-400">Explora nuestro inventario actualizado con disponibilidad en tiempo real.</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
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
                  className="bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                className="bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="destacados">Destacados</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Valorados</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-slate-800/50 border border-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
                  aria-label="Vista de cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
                  aria-label="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-slate-400 text-sm mb-6">{filteredProducts.length} productos encontrados</p>

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
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron productos</h3>
            <p className="text-slate-400 mb-6">Intenta ajustar los filtros o la búsqueda.</p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedCategory("Todas"); }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </main>
  );
}