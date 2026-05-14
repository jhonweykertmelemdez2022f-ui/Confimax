"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, X, ShoppingCart, User } from "lucide-react";

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
        className={`bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full transition-colors focus:outline-none ${open ? "ring-2 ring-cyan-500" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
      >
        <User className="w-5 h-5" />
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-400">Cargando...</div>
          ) : user ? (
            <div>
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="font-semibold text-white">{user.name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <Link href="/ajustes" className="block px-4 py-3 text-slate-300 hover:bg-slate-800 transition-colors">Ajustes</Link>
              <button
                className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 transition-colors"
                onClick={() => { logout(); setOpen(false); }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div>
              <Link href="/login" className="block px-4 py-3 text-slate-300 hover:bg-slate-800 transition-colors">Iniciar sesión</Link>
              <Link href="/registro" className="block px-4 py-3 text-slate-300 hover:bg-slate-800 transition-colors">Registrarse</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP hover animation for logo
  useEffect(() => {
    if (logoRef.current) {
      const handleMouseEnter = () => {
        gsap.to(logoRef.current, { rotation: 90, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      };
      const handleMouseLeave = () => {
        gsap.to(logoRef.current, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      };
      
      const logoEl = logoRef.current as HTMLElement;
      logoEl.addEventListener("mouseenter", handleMouseEnter);
      logoEl.addEventListener("mouseleave", handleMouseLeave);
      
      return () => {
        logoEl.removeEventListener("mouseenter", handleMouseEnter);
        logoEl.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  // GSAP animation for navbar on scroll
  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        backgroundColor: isScrolled ? "rgba(15, 23, 42, 0.9)" : "transparent",
        backdropFilter: isScrolled ? "blur(12px)" : "none",
        boxShadow: isScrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        padding: isScrolled ? "12px 0" : "20px 0",
        borderColor: isScrolled ? "rgba(30, 41, 59, 0.5)" : "transparent",
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isScrolled]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <nav 
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
      style={{ backgroundColor: isScrolled ? "rgba(15, 23, 42, 0.9)" : "transparent", backdropFilter: isScrolled ? "blur(12px)" : "none", padding: isScrolled ? "12px 0" : "20px 0", borderColor: isScrolled ? "rgba(30, 41, 59, 0.5)" : "transparent" }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div ref={logoRef} className="logo-icon w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center cursor-pointer">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span>Confimax</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-slate-300 hover:text-cyan-400 font-medium transition-colors text-sm tracking-wide relative group">
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-slate-300 hover:text-white transition-colors p-2 relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-slate-900"></span>
          </button>
          <UserMenu />
        </div>

        <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

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
          className="md:hidden overflow-hidden bg-slate-900 border-b border-slate-800"
        >
          <div className="p-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-slate-300 hover:text-cyan-400 font-medium py-2 border-b border-slate-800/50" onClick={() => setIsMobileMenuOpen(false)}>
                {link.name}
              </Link>
            ))}
            <button className="w-full bg-slate-800 py-3 rounded-lg text-white font-medium">Ingresar</button>
          </div>
        </div>
      )}
    </nav>
  );
}
