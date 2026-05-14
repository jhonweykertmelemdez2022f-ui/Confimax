"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { 
  ArrowRight, Package, ShieldCheck, Truck, BarChart3, Box, 
  Building2, MessageSquare, LogIn, UserPlus 
} from "lucide-react";

const fadeInUp = (delay = 0) => ({
  opacity: 0,
  y: 20,
  duration: 0.6,
  delay,
  ease: "power2.out"
});

function CategoriasPreview() {
  const categorias = [
    { nombre: "Tecnología", icon: <Package className="w-8 h-8" />, slug: "tecnologia" },
    { nombre: "Industrial", icon: <Box className="w-8 h-8" />, slug: "industrial" },
    { nombre: "Oficina", icon: <BarChart3 className="w-8 h-8" />, slug: "oficina" },
    { nombre: "Herramientas", icon: <ShieldCheck className="w-8 h-8" />, slug: "herramientas" },
  ];
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(titleRef.current, fadeInUp(0));
            if (gridRef.current?.children) {
              gsap.fromTo(gridRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
              );
            }
            gsap.to(linkRef.current, fadeInUp(0.3));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <div ref={titleRef} className="text-center mb-12 opacity-0">
          <h2 className="text-3xl font-bold text-white mb-4">Nuestras Categorías</h2>
          <p className="text-slate-400">Accede directamente a nuestro inventario por sector.</p>
        </div>
        
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categorias.map((cat, idx) => (
            <div key={idx} className="opacity-0">
              <Link href={`/catalogo?cat=${cat.slug}`} className="group block p-8 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-slate-700/50 text-cyan-400 group-hover:text-white group-hover:bg-cyan-600 transition-colors">{cat.icon}</div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">{cat.nombre}</h3>
              </Link>
            </div>
          ))}
        </div>

        <div ref={linkRef} className="mt-12 text-center opacity-0">
          <Link href="/catalogo" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Ver todas las categorías <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: <Package className="w-6 h-6" />, title: "Inventario Real", desc: "Disponibilidad confirmada al instante." },
    { icon: <Truck className="w-6 h-6" />, title: "Logística Directa", desc: "Gestión de envíos optimizada." },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "Garantía de Calidad", desc: "Control estricto antes del despacho." }
  ];
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (gridRef.current?.children) {
              gsap.fromTo(gridRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
              );
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-slate-950">
      <div className="container mx-auto px-4">
        <div ref={gridRef} className="grid md:grid-cols-3 gap-8">
          {features.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-6 opacity-0">
              <div className="mb-4 text-cyan-400 bg-cyan-400/10 p-3 rounded-lg">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickNavButtons() {
  const buttons = [
    { href: "/catalogo", label: "Catálogo", icon: <Package className="w-5 h-5" />, type: "primary" },
    { href: "/nosotros", label: "Nosotros", icon: <Building2 className="w-5 h-5" />, type: "secondary" },
    { href: "/contacto", label: "Contacto", icon: <MessageSquare className="w-5 h-5" />, type: "secondary" },
    { href: "/login", label: "Ingresar", icon: <LogIn className="w-5 h-5" />, type: "auth" },
    { href: "/registro", label: "Registrarse", icon: <UserPlus className="w-5 h-5" />, type: "auth" },
  ];
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(titleRef.current, fadeInUp(0));
            if (buttonsRef.current?.children) {
              gsap.fromTo(buttonsRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
              );
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 bg-slate-950/80 border-y border-slate-800/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 ref={titleRef} className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-6 opacity-0">Navegación Rápida</h2>
        <div ref={buttonsRef} className="flex flex-wrap justify-center gap-3 md:gap-4">
          {buttons.map((btn, idx) => (
            <div key={idx} className="opacity-0">
              <Link href={btn.href} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 border text-sm hover:-translate-y-0.5 hover:scale-105 active:scale-95
                ${btn.type === "primary" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent hover:shadow-lg hover:shadow-cyan-500/20" 
                  : btn.type === "auth" ? "bg-slate-800/60 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400/40"
                  : "bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-700/50 hover:text-white hover:border-slate-600"}`}>
                {btn.icon} {btn.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const ctaH2Ref = useRef<HTMLHeadingElement>(null);
  const ctaPRef = useRef<HTMLParagraphElement>(null);
  const ctaLinkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(badgeRef.current, fadeInUp(0));
    gsap.to(h1Ref.current, fadeInUp(0.1));
    gsap.to(pRef.current, fadeInUp(0.2));

    const ctaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(ctaH2Ref.current, fadeInUp(0));
            gsap.to(ctaPRef.current, fadeInUp(0.1));
            gsap.to(ctaLinkRef.current, fadeInUp(0.2));
            ctaObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ctaSectionRef.current) ctaObserver.observe(ctaSectionRef.current);
    return () => ctaObserver.disconnect();
  }, []);

  return (
    <main className="min-h-screen">
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-400 text-sm font-medium mb-8 opacity-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Catálogo Actualizado
          </div>
          <h1 ref={h1Ref} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight opacity-0">
            Todo lo que necesitas,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">en un solo lugar.</span>
          </h1>
          <p ref={pRef} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto opacity-0">
            Accede a nuestro inventario completo. Productos verificados, precios competitivos y gestión eficiente para tus requerimientos.
          </p>
        </div>
      </section>
      <QuickNavButtons />
      <CategoriasPreview />
      <Features />
      <section ref={ctaSectionRef} className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <h2 ref={ctaH2Ref} className="text-3xl font-bold text-white mb-4 opacity-0">¿No encuentras lo que buscas?</h2>
          <p ref={ctaPRef} className="text-slate-400 mb-8 max-w-xl mx-auto opacity-0">Nuestro equipo comercial puede ayudarte a localizar productos específicos o gestionar pedidos mayoristas.</p>
          <div ref={ctaLinkRef} className="opacity-0">
            <Link href="/contacto" className="text-cyan-400 hover:text-cyan-300 font-medium border-b border-cyan-400/30 hover:border-cyan-300 pb-1 transition-colors">Solicitar Cotización Especial</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
