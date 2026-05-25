"use client"

import { ShoppingCart, Star, Package, Eye } from "lucide-react"
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
    if (stock <= 10) return { label: "BAJO STOCK", color: "text-error" }
    if (stock <= 30) return { label: "MEDIO", color: "text-slate-500 dark:text-secondary" }
    return { label: "DISPONIBLE", color: "text-[#00FF66]" }
  }

  const stockStatus = getStockStatus(product.stock)

  // List View
  if (viewMode === "list") {
    return (
      <article className="bg-white dark:bg-surface border border-slate-900 dark:border-white overflow-hidden hover:border-data-blue hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-[#222]">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105 grayscale group-hover:grayscale-0"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            {product.badge && (
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-data-label text-data-label uppercase text-white dark:text-background bg-accent-pink">
                {product.badge}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="font-data-label text-data-label text-xs uppercase tracking-wider text-data-blue">{product.category}</span>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white mt-1 uppercase group-hover:text-data-blue transition-colors">
                  {product.name}
                </h3>
              </div>
              <div className="font-data-label text-data-label text-xs text-slate-500 dark:text-slate-500">
                ID: {product.id.slice(0, 8).toUpperCase()}
              </div>
            </div>

            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) ? "text-accent-pink fill-accent-pink" : "text-slate-500"}
                  />
                ))}
              </div>
              <span className="font-data-value text-data-value text-sm text-slate-900 dark:text-white">{product.rating}</span>
              <span className="font-data-label text-data-label text-xs text-slate-500 dark:text-slate-500">({product.reviews} REV)</span>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-data-value text-data-value text-xl font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="font-data-label text-data-label text-sm text-slate-500 dark:text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <span className={`font-data-label text-data-label text-xs ${stockStatus.color}`}>
                  • {stockStatus.label}: {product.stock} UNIDADES
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/catalogo/${product.id}`}
                  className="p-3 border border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors"
                  aria-label="Ver detalles"
                >
                  <Eye size={18} className="text-slate-900 dark:text-white" />
                </Link>
                <button
                  className="p-3 border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-background hover:bg-slate-800 dark:hover:bg-slate-100 transition-all font-data-label text-data-label uppercase"
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
    <article className="bg-white dark:bg-surface border border-slate-900 dark:border-white overflow-hidden hover:border-data-blue hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-[#222]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105 grayscale group-hover:grayscale-0"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-data-label text-data-label uppercase text-white dark:text-background bg-accent-pink">
            {product.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="font-data-label text-data-label text-xs uppercase tracking-wider text-data-blue">{product.category}</span>
          <span className="font-data-label text-data-label text-xs text-slate-500 dark:text-slate-500">
            {product.id.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white mt-1 mb-2 uppercase line-clamp-1 group-hover:text-data-blue transition-colors">
          {product.name}
        </h3>
        <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(product.rating) ? "text-accent-pink fill-accent-pink" : "text-slate-500"}
              />
            ))}
          </div>
          <span className="font-data-value text-data-value text-xs text-slate-900 dark:text-white ml-1">{product.rating}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-data-value text-data-value text-lg font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="font-data-label text-data-label text-sm text-slate-500 dark:text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-data-label font-data-label ${stockStatus.color}`}>
            <Package size={12} />
            <span>{product.stock}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/catalogo/${product.id}`}
            className="flex-1 py-3 text-center text-sm font-data-label uppercase border border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors text-slate-900 dark:text-white min-h-[44px] flex items-center justify-center"
          >
            Ver
          </Link>
          <button
            className="flex-1 py-3 text-sm font-data-label uppercase border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-background hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            onClick={() => addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category
            })}
          >
            <ShoppingCart size={16} /> Añadir
          </button>
        </div>
      </div>
    </article>
  )
}