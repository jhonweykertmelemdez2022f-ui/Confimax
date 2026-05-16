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
      <section ref={heroRef} className="relative w-full border-b border-slate-900 dark:border-white min-h-[80vh] flex flex-col justify-center items-center px-6 md:px-margin-page py-20 overflow-hidden bg-white dark:bg-background">
        {/* Crosshairs */}
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />
        <div className="crosshair-bl" />
        <div className="crosshair-br" />

        <div className="text-center z-10 flex flex-col items-center gap-6">
          <span className="font-data-label text-data-label text-slate-500 dark:text-secondary tracking-widest uppercase border border-slate-900/20 dark:border-white/20 px-3 py-1 bg-slate-100 dark:bg-surface-dim">
            CUIDADO INTEGRAL // DISEÑADO PARA TU BIENESTAR
          </span>
          <h1 className="font-display-xl text-display-xl text-slate-900 dark:text-white uppercase text-center max-w-4xl tracking-tighter leading-none hidden md:block">
            DESPENSA Y<br/>BIENESTAR
          </h1>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase text-center max-w-full tracking-tighter leading-none md:hidden mt-4">
            DESPENSA Y<br/>BIENESTAR
          </h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-2xl text-center mt-4 border-l-2 border-data-blue pl-4 bg-slate-100/50 dark:bg-surface-variant/30 p-4">
            Tu despensa y bienestar en un solo lugar. Seguridad desde tu mesa hasta tu botiquín, con calibración exacta para tu salud diaria.
          </p>
          <Link 
            href="/catalogo" 
            className="btn-precision mt-8 relative group overflow-hidden"
          >
            <span className="absolute top-1 right-1 text-[8px] text-slate-500 dark:text-secondary group-hover:text-white transition-colors btn-serial">ACT-01</span>
            INICIAR ADQUISICIÓN
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">health_and_safety</span>
          </Link>
        </div>

        {/* Hero Image / Technical Graphic Placeholder */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex justify-center items-center mix-blend-screen grayscale">
          <img 
            alt="" 
            className="w-full h-full object-cover max-w-3xl opacity-50" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsTWkeafd4Bb5YvU5KJTmoLKm4j91ogiThsibaWHquX_wdsRvADjQXK2gCLlVXDc2u00BIotSpYzUBxvBcOo4a3szttk7JXraNw0Rmu8kbaUxTgZ2kunYarX1ryM9rKi4oTd6joYF3hfJuJ-0yODbonNYgsOLyoiaLyJbodNvydQW10u7EINucAfXZH1BTujHz0Itls6Qeu4nbsIqV4ZphIu4ZDPM_xVgIUui-6vDCMfFT4sUFtwVYVaEJoU4v66WZ_TioL7-rlcw" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
        </div>
      </section>

      {/* Data Specs / Features Grid */}
      <section ref={featuresRef} className="w-full grid grid-cols-1 md:grid-cols-3 border-b border-slate-900 dark:border-white bg-white dark:bg-surface">
        <div className="border-b md:border-b-0 md:border-r border-slate-900 dark:border-white p-8 flex flex-col gap-6 hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">eco</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">01 // BIE</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">LOGÍSTICA DE BIENESTAR</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Rutas algorítmicas que aseguran la entrega inmediata de activos nutricionales y de salud a tu sector primario.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-900/20 dark:bg-white/20 mt-auto group-hover:bg-[#00FF66] transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-slate-900 dark:bg-white transform -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-linear" />
          </div>
        </div>

        <div className="border-b md:border-b-0 md:border-r border-slate-900 dark:border-white p-8 flex flex-col gap-6 hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">medication</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">02 // FAR</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">PRECISIÓN FARMACÉUTICA</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Tolerancias micro-calibradas en todo empaque médico y orgánico. Integridad verificada mediante escaneo molecular.
            </p>
          </div>
          <div className="w-full h-[1px] bg-slate-900/20 dark:bg-white/20 mt-auto group-hover:bg-data-blue transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/4 bg-slate-900 dark:bg-white transform -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000 ease-linear" />
          </div>
        </div>

        <div className="p-8 flex flex-col gap-6 hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white">restaurant</span>
            <span className="font-data-label text-data-label text-slate-500 dark:text-slate-400">03 // NUT</span>
          </div>
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">SÍNTESIS NUTRICIONAL</h3>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">
              Protocolos de extracción a nivel de laboratorio que garantizan el máximo rendimiento de los especímenes botánicos y alimentarios.
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