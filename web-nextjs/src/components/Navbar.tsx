"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, X, ShoppingCart, User, Sun, Moon } from "lucide-react";

// Componente de menú de usuario
function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Animar dropdown con GSAP
  useEffect(() => {
    if (dropdownRef.current) {
      if (open) {
        gsap.fromTo(dropdownRef.current, 
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }
        );
      }
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none"
        onClick={() => setOpen((v) => !v)}
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
              <Link href="/ajustes" className="block px-4 py-3 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-data-label uppercase">Ajustes</Link>
              <button
                className="w-full text-left px-4 py-3 text-red-600 dark:text-error hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-data-label uppercase"
                onClick={() => { logout(); setOpen(false); }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div>
              <Link href="/login" className="block px-4 py-3 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-data-label uppercase">Iniciar sesión</Link>
              <Link href="/registro" className="block px-4 py-3 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-data-label uppercase">Registrarse</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navRef = useRef(null);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <nav 
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-900 dark:border-white bg-white/90 dark:bg-background/90 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between w-full px-margin-page py-4 max-w-full">
        {/* Logo and Menu */}
        <div className="flex items-center gap-4">
          <button 
            className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 border-l border-slate-900/20 dark:border-white/20 pl-8">
          <Link className="text-slate-900 dark:text-white font-headline-lg border-b border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors duration-200 px-2 py-1" href="/">
            INICIO
          </Link>
          <Link className="text-slate-500 dark:text-secondary font-data-label uppercase hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors duration-200 px-2 py-1" href="/catalogo">
            CATÁLOGO
          </Link>
          <Link className="text-slate-500 dark:text-secondary font-data-label uppercase hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors duration-200 px-2 py-1" href="/nosotros">
            NOSOTROS
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <span className="font-data-label text-data-label text-slate-500 dark:text-secondary hidden md:inline-block">
          </span>
          
          {/* Theme Toggle */}
          <button 
            className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label border border-slate-900 dark:border-white px-4 py-2 uppercase flex items-center gap-2"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden md:inline">{theme === 'dark' ? 'CLARO' : 'OSCURO'}</span>
          </button>

          <button className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 p-2 border border-transparent hover:border-slate-900 dark:hover:border-white focus:outline-none relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-pink rounded-full"></span>
          </button>
          
          <UserMenu />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={(el) => {
            if (el) {
              gsap.fromTo(el, 
                { height: 0, opacity: 0 },
                { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" }
              );
            }
          }}
          className="md:hidden overflow-hidden bg-white/90 dark:bg-surface/90 backdrop-blur-sm border-b border-slate-900 dark:border-white"
        >
          <div className="p-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright font-data-label text-data-label uppercase py-2 border-b border-slate-200 dark:border-white/20" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-4">
              <button 
                className="text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 font-data-label text-data-label border border-slate-900 dark:border-white px-4 py-2 uppercase flex items-center gap-2"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'MODO CLARO' : 'MODO OSCURO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}