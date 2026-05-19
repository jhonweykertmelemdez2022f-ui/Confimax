"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, Minus, Moon, Plus, ShoppingCart, Sun, Trash2, User, X } from "lucide-react";

function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const menuItemClass = "block w-full border-l-2 border-transparent px-4 py-3 text-left font-data-label text-data-label uppercase text-slate-900 transition-colors hover:border-data-blue hover:bg-data-blue hover:text-white focus-visible:border-data-blue focus-visible:bg-data-blue focus-visible:text-white focus-visible:outline-none dark:text-white";

  useEffect(() => {
    if (dropdownRef.current && open) {
      gsap.fromTo(dropdownRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" });
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menú de usuario"
      >
        <User className="w-5 h-5" />
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-surface/95 backdrop-blur-sm border border-slate-900 dark:border-white z-50 overflow-hidden"
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 dark:text-secondary">Cargando...</div>
          ) : user ? (
            <div>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/20">
                <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-secondary">{user.email}</div>
              </div>
              {user && (user.role === "admin" || user.role === "vendedor") && (
                <Link href="/dashboard" className={menuItemClass} onClick={() => setOpen(false)}>Dashboard</Link>
              )}
              <Link href="/ajustes" className={menuItemClass} onClick={() => setOpen(false)}>Ajustes</Link>
              <button
                className="block w-full border-l-2 border-transparent px-4 py-3 text-left font-data-label text-data-label uppercase text-red-600 transition-colors hover:border-error hover:bg-error hover:text-white focus-visible:border-error focus-visible:bg-error focus-visible:text-white focus-visible:outline-none dark:text-error"
                onClick={() => { logout(); setOpen(false); }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div>
              <Link href="/login" className={menuItemClass}>Iniciar sesión</Link>
              <Link href="/registro" className={menuItemClass}>Registrarse</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const { user } = useAuth();
  const pathname = usePathname();
  const navRef = useRef(null);

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
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-900 dark:border-white bg-white/90 dark:bg-background/90 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between w-full px-margin-page py-4 max-w-full">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
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

          <div className="flex items-center gap-4">
            <button
              className="theme-toggle text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label border border-slate-900 dark:border-white px-4 py-2 uppercase flex items-center gap-2"
              onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden md:inline">{theme === "dark" ? "CLARO" : "OSCURO"}</span>
            </button>

            <button
              className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none relative"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-accent-pink text-white text-[10px] leading-5 text-center font-data-label rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            <UserMenu />
          </div>
        </div>

        {/* Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}

        {/* Sidebar Drawer */}
        <div
          ref={(el) => {
            if (el) {
              if (isMobileMenuOpen) {
                gsap.to(el, { x: 0, duration: 0.3, ease: "power3.out" });
              } else {
                gsap.to(el, { x: "-100%", duration: 0.3, ease: "power3.in" });
              }
            }
          }}
          className="fixed top-0 left-0 bottom-0 z-50 w-3/4 max-w-sm bg-white dark:bg-surface shadow-2xl border-r border-slate-900 dark:border-white transform -translate-x-full md:hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-900 dark:border-white">
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase tracking-tighter">
              CONFIMAX
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 border border-slate-900 dark:border-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 mt-2">
            {[...navLinks, { name: "Contacto", href: "/contacto" }].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${isActive(link.href) ? "text-data-blue border-l-4 border-data-blue bg-blue-50/50 dark:bg-blue-900/10 pl-3 font-bold" : "text-slate-700 dark:text-slate-300 pl-4 border-l-4 border-transparent"} hover:bg-slate-100 dark:hover:bg-surface-bright font-data-label text-data-label uppercase py-4 transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-secondary text-center uppercase font-data-label">Confimax v1.0</p>
            <button
              className="theme-toggle text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 rounded-full"
              onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>
      <CartDrawer />
    </>
  );
}
