"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { Menu, Minus, Moon, Plus, ShoppingCart, Sun, Trash2, X } from "lucide-react";

function CartDrawer() {
  const { clearCart, isOpen, items, removeItem, setIsOpen, totalItems, totalPrice, updateQuantity } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar carrito"
        onClick={() => setIsOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-900 bg-white text-slate-900 shadow-2xl dark:border-white dark:bg-surface dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-900 p-5 dark:border-white">
          <div>
            <p className="font-data-label text-data-label uppercase text-data-blue">Tu compra</p>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile uppercase">Carrito</h2>
          </div>
          <button
            className="border border-slate-900 p-2 hover:bg-slate-900 hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-background"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="mb-4 h-14 w-14 text-slate-500" />
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile uppercase">Carrito vacío</h3>
            <p className="mt-2 font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Agrega productos del catálogo y aquí verás tu lista de compra.
            </p>
            <Link
              href="/catalogo"
              className="btn-precision mt-6"
              onClick={() => setIsOpen(false)}
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                {items.map((item) => (
                  <article key={item.id} className="grid grid-cols-[72px_1fr] gap-4 border border-slate-900 bg-white/70 p-3 dark:border-white dark:bg-surface-dim">
                    <img src={item.image} alt={item.name} className="h-[72px] w-[72px] object-cover grayscale" />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-data-label text-data-label uppercase text-data-blue">{item.category}</p>
                          <h3 className="font-data-value text-data-value text-slate-900 dark:text-white">{item.name}</h3>
                        </div>
                        <button
                          className="text-slate-500 hover:text-error"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-slate-900 dark:border-white">
                          <button
                            className="p-1.5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Restar ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-9 text-center font-data-label text-data-label">{item.quantity}</span>
                          <button
                            className="p-1.5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Sumar ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-data-value text-data-value">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-900 p-5 dark:border-white">
              <div className="mb-4 flex items-center justify-between font-data-value text-data-value">
                <span>{totalItems} {totalItems === 1 ? "producto" : "productos"}</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-precision justify-center px-4 py-3" onClick={clearCart}>
                  Vaciar
                </button>
                <button className="btn-precision justify-center bg-slate-900 px-4 py-3 text-white dark:bg-white dark:text-background">
                  Comprar
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { setIsOpen, totalItems } = useCart();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Nosotros", href: "/nosotros" },
  ];

  if (user && (user.role === "admin" || user.role === "vendedor")) {
    navLinks.push({ name: "Dashboard", href: "/dashboard" });
  }

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const navClass = (href: string) => {
    const active = isActive(href);
    return [
      active ? "text-slate-900 dark:text-white border-b border-slate-900 dark:border-white font-headline-lg" : "text-slate-500 dark:text-secondary font-data-label",
      "uppercase hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors duration-200 px-2 py-1",
    ].join(" ");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-900 dark:border-white bg-white/95 dark:bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between w-full px-4 py-3 max-w-full">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="font-headline-lg text-headline-lg text-slate-900 dark:text-white uppercase tracking-tighter hidden md:block">
              CONFIMAX
            </Link>
            <Link href="/" className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase tracking-tighter md:hidden">
              CONFIMAX
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 border-l border-slate-900/20 dark:border-white/20 pl-8">
            {navLinks.map((link) => (
              <Link key={link.href} className={navClass(link.href)} href={link.href}>
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              className="theme-toggle text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label border-2 border-slate-900 dark:border-white bg-white dark:bg-surface px-4 py-2 uppercase flex items-center gap-2"
              onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? "CLARO" : "OSCURO"}</span>
            </button>

            <button
              className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface focus:outline-none relative"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-accent-pink text-white text-[10px] leading-6 text-center font-data-label rounded-full border-2 border-white dark:border-background">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">{user.name}</span>
                <button
                  className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none text-red-600 dark:text-error"
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label uppercase">
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label uppercase">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 bottom-0 z-[60] w-[85%] max-w-sm bg-white dark:bg-surface shadow-2xl border-r-4 border-slate-900 dark:border-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-surface-dim">
            <span className="font-headline-lg text-2xl text-slate-900 dark:text-white uppercase tracking-tighter">
              CONFIMAX
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Enlaces de navegación */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2 mb-6">
              {[...navLinks, { name: "Contacto", href: "/contacto" }].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                    block px-4 py-4 border-2 transition-all duration-200
                    ${isActive(link.href) 
                      ? "border-slate-900 dark:border-white bg-data-blue text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" 
                      : "border-transparent text-slate-700 dark:text-slate-300 hover:border-slate-900 dark:hover:border-white hover:bg-slate-100 dark:hover:bg-surface-bright"}
                    font-data-label text-base uppercase tracking-wide
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Enlaces de sesión */}
            <div className="border-t-2 border-slate-200 dark:border-white/20 pt-6">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <p className="font-data-label uppercase text-xs">Bienvenido</p>
                    <p className="font-headline-lg-mobile">{user.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-4 border-2 border-error bg-error/10 text-error hover:bg-error hover:text-white transition-colors font-data-label text-base uppercase tracking-wide"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-4 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background transition-colors font-data-label text-base uppercase tracking-wide"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registro"
                    className="block w-full px-4 py-4 border-2 border-slate-900 dark:border-white bg-data-blue text-white hover:bg-data-blue/90 transition-colors font-data-label text-base uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-4 border-t-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-surface-dim">
            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center justify-center p-4 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background transition-colors"
                onClick={(event) => {
                  toggleTheme({ x: event.clientX, y: event.clientY });
                }}
              >
                {theme === "dark" ? <Sun className="w-7 h-7 mb-1" /> : <Moon className="w-7 h-7 mb-1" />}
                <span className="text-[10px] font-data-label uppercase font-bold">Tema</span>
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background transition-colors relative"
                onClick={() => {
                  setIsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <ShoppingCart className="w-7 h-7 mb-1" />
                {totalItems > 0 && (
                  <span className="absolute top-2 right-2 min-w-5 h-5 bg-accent-pink text-white text-[10px] leading-5 text-center font-data-label rounded-full border-2 border-white dark:border-background">
                    {totalItems}
                  </span>
                )}
                <span className="text-[10px] font-data-label uppercase font-bold">Carrito</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-data-label tracking-widest">Confimax v1.0</p>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
