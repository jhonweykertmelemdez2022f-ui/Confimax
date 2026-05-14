"use client"

import { Heart, ShoppingCart, Star, Package, Eye } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  rating: number
  reviews: number
  stock: number
  image: string
  badge?: string
  description: string
}

interface ProductCardProps {
  product: Product
  viewMode: "grid" | "list"
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addItem } = useCart();
  const getStockStatus = (stock: number) => {
    if (stock <= 10) return { label: "Bajo stock", color: "text-red-400" }
    if (stock <= 30) return { label: "Stock medio", color: "text-amber-400" }
    return { label: "Disponible", color: "text-green-400" }
  }

  const stockStatus = getStockStatus(product.stock)

  // List View
  if (viewMode === "list") {
    return (
      <article className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all group">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
              loading="lazy"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-blue-600 to-cyan-600">
                {product.badge}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">{product.category}</span>
                <h3 className="text-lg font-semibold text-white mt-1 group-hover:text-blue-400 transition-colors">
                  {product.name}
                </h3>
              </div>
              <button className="p-2 rounded-lg bg-slate-800 text-slate-600 cursor-not-allowed" aria-label="Favoritos no disponible" disabled>
                <Heart size={18} />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-300">{product.rating}</span>
              <span className="text-sm text-slate-500">({product.reviews})</span>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${stockStatus.color}`}>
                  • {stockStatus.label}: {product.stock} unidades
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/catalogo/${product.id}`}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                  aria-label="Ver detalles"
                >
                  <Eye size={18} className="text-slate-300" />
                </Link>
                <button
                  className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all text-white shadow-lg shadow-blue-500/25"
                  aria-label="Añadir al carrito"
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    category: product.category
                  })}
                >
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Grid View
  return (
    <article className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
          loading="lazy"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-blue-600 to-cyan-600">
            {product.badge}
          </span>
        )}
        <button className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-slate-600 cursor-not-allowed opacity-0 group-hover:opacity-100" disabled>
          <Heart size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">{product.category}</span>
        <h3 className="text-base font-semibold text-white mt-1 mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}
              />
            ))}
          </div>
          <span className="text-xs text-slate-300 ml-1">{product.rating}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${stockStatus.color}`}>
            <Package size={12} />
            <span>{product.stock}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/catalogo/${product.id}`}
            className="flex-1 py-2.5 text-center text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-white"
          >
            Ver
          </Link>
          <button
            className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-500 transition-all text-white flex items-center justify-center gap-1"
            onClick={() => addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category
            })}
          >
            <ShoppingCart size={14} /> Añadir
          </button>
        </div>
      </div>
    </article>
  )
}