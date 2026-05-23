"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";

export default function NosotrosPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children, 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" }
      );
    }

    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.4 }
      );
    }

    if (valuesRef.current) {
      gsap.fromTo(valuesRef.current.children, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", scrollTrigger: {
          trigger: valuesRef.current,
          start: "top 80%"
        }}
      );
    }
  }, []);

  const values = [
    { icon: "verified", title: "CALIDAD", desc: "Seleccionamos minuciosamente cada producto fresco y marca para tu tranquilidad." },
    { icon: "sell", title: "PRECIOS", desc: "Mantenemos márgenes bajos y ofertas reales para cuidar la economía de tu hogar." },
    { icon: "group", title: "TRATO HUMANO", desc: "Detrás de cada pedido hay personas esforzándose por darte la mejor atención." },
    { icon: "military_tech", title: "MEJORA CONSTANTE", desc: "Escuchamos tus sugerencias para ampliar nuestro catálogo y mejorar el servicio." },
  ];

  const stats = [
    { value: "12+", label: "AÑOS ATENDIENDO", code: "EXP" },
    { value: "5K+", label: "ENTREGAS HECHAS", code: "DLV" },
    { value: "300+", label: "PRODUCTOS ACTIVOS", code: "SKU" },
    { value: "98%", label: "SATISFACCIÓN", code: "RTG" },
  ];

  return (
    <main className="min-h-screen flex-grow flex flex-col bg-transparent">
      {/* Hero Section */}
      <section ref={heroRef} className="relative w-full border-b border-slate-900 dark:border-white min-h-[60vh] flex flex-col justify-center px-6 md:px-margin-page py-20 bg-transparent">
        {/* Crosshairs */}
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />

        <div className="z-10 flex flex-col max-w-5xl gap-6">
          <span className="self-start font-data-label text-data-label text-slate-500 dark:text-secondary tracking-widest uppercase border border-slate-900/20 dark:border-white/20 px-3 py-1 bg-slate-100 dark:bg-surface-dim">
            NOSOTROS // HISTORIA
          </span>
          <h1 className="font-display-xl text-display-xl text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
            MÁS QUE UN<br />SÚPER
          </h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-2xl border-l-2 border-data-blue pl-4 bg-slate-100/50 dark:bg-surface-variant/30 p-4 mt-2">
            Confimax nació para resolver la compra diaria con buenos precios, variedad y un servicio excepcional. Cambiamos la forma de hacer el súper, haciéndola simple, rápida y transparente.
          </p>
        </div>
      </section>

      {/* Stats - Data Grid */}
      <section className="w-full border-b border-slate-900 dark:border-white bg-transparent">
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className={`p-8 flex flex-col items-center text-center hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors relative group border-b lg:border-b-0 ${idx % 2 === 0 ? "border-r border-slate-900 dark:border-white" : "lg:border-r border-slate-900 dark:border-white"} ${idx === 3 ? "lg:border-r-0" : ""}`}>
              <span className="absolute top-4 left-4 font-data-label text-[10px] text-slate-400 dark:text-slate-500">{stat.code}</span>
              <p className="font-display-xl text-[48px] md:text-[64px] text-slate-900 dark:text-white font-black leading-none mt-4 mb-2">{stat.value}</p>
              <p className="font-data-label text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900/20 dark:bg-white/20">
                <div className="h-full w-0 group-hover:w-full bg-data-blue transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-6 md:px-margin-page border-b border-slate-900 dark:border-white bg-slate-50/50 dark:bg-surface-dim/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white uppercase mb-4">NUESTROS VALORES</h2>
            <div className="w-24 h-1 bg-data-blue mb-6"></div>
            <p className="font-body-md text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
              Principios inquebrantables que guían cada entrega y cada interacción con nuestros clientes.
            </p>
          </div>
          
          <div ref={valuesRef} className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {values.map((value, idx) => (
              <div key={idx} className="flex gap-6 p-6 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright hover:border-data-blue transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 dark:bg-surface-variant -mr-8 -mt-8 rotate-45 transform group-hover:bg-data-blue/10 transition-colors" />
                <div className="flex-shrink-0 flex items-start justify-center pt-1">
                  <span className="material-symbols-outlined text-[32px] text-slate-900 dark:text-white group-hover:text-data-blue transition-colors">
                    {value.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-lg-mobile text-xl text-slate-900 dark:text-white uppercase mb-2 tracking-tight">{value.title}</h3>
                  <p className="font-body-md text-slate-600 dark:text-slate-400">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High Contrast CTA */}
      <section className="py-24 px-6 md:px-margin-page bg-transparent relative">
        <div className="max-w-5xl mx-auto border-2 border-slate-900 dark:border-white p-12 md:p-20 text-center relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 group">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:bg-[position:200%_0,0_0] transition-all duration-[2s] ease-linear" />
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="font-headline-lg text-4xl md:text-5xl uppercase tracking-tighter mb-6">
              ¿LISTO PARA COMPRAR?
            </h2>
            <p className="font-body-md text-lg text-slate-300 dark:text-slate-700 mb-10 max-w-2xl mx-auto border-l-2 border-data-blue pl-4 py-2 bg-black/20 dark:bg-white/50">
              No pierdas más tiempo en el supermercado. Empieza a comprar online y descubre la comodidad de Confimax.
            </p>
            <Link 
              href="/catalogo" 
              className="btn-precision inline-flex items-center gap-3 bg-white text-slate-900 border-none hover:bg-slate-200 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              IR AL CATÁLOGO
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
