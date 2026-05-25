"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animación del Hero
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        { 
          opacity: 0, 
          y: 60 
        },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          stagger: 0.2, 
          ease: "power3.out",
          delay: 0.3
        }
      );
    }

    // Animación de las features
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current.children, 
        { 
          opacity: 0, 
          y: 40,
          x: -20
        },
        { 
          opacity: 1, 
          y: 0,
          x: 0,
          duration: 0.8, 
          stagger: 0.15, 
          ease: "power3.out",
          delay: 0.8
        }
      );
    }
  }, []);

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section ref={heroRef} className="relative w-full border-b border-slate-900 dark:border-white min-h-[70dvh] sm:min-h-[80vh] flex flex-col justify-center items-center px-4 sm:px-6 md:px-margin-page py-12 sm:py-20 overflow-hidden bg-transparent">
        {/* Crosshairs */}
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />
        <div className="crosshair-bl" />
        <div className="crosshair-br" />

        <div className="text-center z-10 flex flex-col items-center gap-4 sm:gap-6">
          <span className="font-data-label text-[10px] sm:text-data-label text-slate-500 dark:text-secondary tracking-widest uppercase border border-slate-900/20 dark:border-white/20 px-3 py-1 bg-slate-100 dark:bg-surface-dim">
            CONFIMAX // PRECIOS QUE RINDEN
          </span>
          <h1 className="font-display-xl text-4xl sm:text-display-xl text-slate-900 dark:text-white uppercase text-center max-w-4xl tracking-tighter leading-none hidden md:block">
            MERCADO Y<br/>DESPENSA
          </h1>
          <h1 className="font-headline-lg-mobile text-3xl sm:text-headline-lg-mobile text-slate-900 dark:text-white uppercase text-center max-w-full tracking-tighter leading-none md:hidden mt-4">
            MERCADO Y<br/>DESPENSA
          </h1>
          <p className="font-body-md text-sm sm:text-body-md text-slate-600 dark:text-slate-400 max-w-2xl text-center mt-4 border-l-2 border-data-blue pl-4 bg-slate-100/50 dark:bg-surface-variant/30 p-4">
            Productos frescos, básicos de la semana y antojos de siempre con precios justos y atención cercana.
          </p>
          <Link 
            href="/catalogo" 
            className="btn-precision mt-6 sm:mt-8 relative group overflow-hidden min-h-[48px] px-8"
          >
            <span className="absolute top-1 right-1 text-[8px] text-slate-500 dark:text-secondary group-hover:text-white transition-colors btn-serial">HOY</span>
            VER OFERTAS
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">shopping_basket</span>
          </Link>
        </div>
      </section>

      {/* Data Specs / Features Grid */}
      <section ref={featuresRef} className="w-full grid grid-cols-1 md:grid-cols-3 border-b border-slate-900 dark:border-white bg-transparent">
        <div className="border-b md:border-b-0 md:border-r border-slate-900 dark:border-white p-8 flex flex-col gap-6 hover:bg-slate-50/80 dark:hover:bg-surface-bright/80 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">local_offer</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">01 // BIE</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">PRECIOS QUE RINDEN</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Ofertas claras en productos de uso diario para que la compra alcance más sin sacrificar calidad.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-900/20 dark:bg-white/20 mt-auto group-hover:bg-[#00FF66] transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-slate-900 dark:bg-white transform -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-linear" />
          </div>
        </div>

        <div className="border-b md:border-b-0 md:border-r border-slate-900 dark:border-white p-8 flex flex-col gap-6 hover:bg-slate-50/80 dark:hover:bg-surface-bright/80 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">shopping_bag</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">02 // FAR</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">BUENOS PRODUCTOS</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Alimentos, limpieza y despensa seleccionados para resolver la semana con marcas confiables.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-900/20 dark:bg-white/20 mt-auto group-hover:bg-data-blue transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-slate-900 dark:bg-white transform -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-linear" />
          </div>
        </div>

        <div className="p-8 flex flex-col gap-6 hover:bg-slate-50/80 dark:hover:bg-surface-bright/80 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">support_agent</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">03 // NUT</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">ATENCIÓN CERCANA</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Te atendemos como vecino: rápido, claro y con ganas de ayudarte a llevar justo lo que necesitas.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-900/20 dark:bg-white/20 mt-auto group-hover:bg-[#00FF66] transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-slate-900 dark:bg-white transform -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-linear" />
          </div>
        </div>
      </section>
    </main>
  );
}
