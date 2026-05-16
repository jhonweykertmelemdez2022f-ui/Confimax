"use client";

import { ShieldCheck, Target, Users, Award, Truck, Package } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function NosotrosPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animación del header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animación de las estadísticas
    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children, 
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)", delay: 0.3 }
      );
    }

    // Animación de los valores
    if (valuesRef.current) {
      gsap.fromTo(valuesRef.current.children, 
        { opacity: 0, y: 40, rotateY: 15 },
        { opacity: 1, y: 0, rotateY: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.6 }
      );
    }

    // Animación del proceso
    if (processRef.current) {
      gsap.fromTo(processRef.current.children, 
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 0.9 }
      );
    }

    // Animación del CTA
    if (ctaRef.current) {
      gsap.fromTo(ctaRef.current, 
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)", delay: 1.2 }
      );
    }
  }, []);

  const values = [
    { icon: <ShieldCheck className="w-8 h-8" />, title: "CALIDAD GARANTIZADA", desc: "Cada producto pasa por estrictos controles antes de llegar a ti." },
    { icon: <Target className="w-8 h-8" />, title: "ENFOQUE EN RESULTADOS", desc: "Soluciones diseñadas para optimizar tus procesos y maximizar eficiencia." },
    { icon: <Users className="w-8 h-8" />, title: "COMPROMISO HUMANO", desc: "Un equipo dedicado a entender y resolver tus necesidades específicas." },
    { icon: <Award className="w-8 h-8" />, title: "EXCELENCIA CONTINUA", desc: "Mejora constante en productos, servicios y experiencia de cliente." },
  ];

  const stats = [
    { value: "12+", label: "AÑOS DE EXPERIENCIA" },
    { value: "5000+", label: "CLIENTES SATISFECHOS" },
    { value: "2000+", label: "PRODUCTOS EN CATÁLOGO" },
    { value: "98%", label: "TASA DE SATISFACCIÓN" },
  ];

  return (
    <main className="min-h-screen pt-12 pb-20 bg-white dark:bg-background">
      {/* Hero */}
      <section ref={headerRef} className="relative py-20 overflow-hidden border-b border-slate-900 dark:border-white">
        <div className="w-full px-margin-page text-center">
          <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-6 uppercase">Sobre Confimax</h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Somos una empresa dedicada a proveer soluciones integrales en productos industriales, tecnológicos y de oficina. 
            Nuestra misión es conectar a las empresas con las herramientas que necesitan para crecer.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-12 bg-white dark:bg-surface border-b border-slate-900 dark:border-white">
        <div className="w-full px-margin-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center border-r border-slate-900/20 dark:border-white/20 last:border-r-0">
                <p className="font-display-xl text-display-xl text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={valuesRef} className="py-20">
        <div className="w-full px-margin-page">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-4 uppercase">Nuestros Valores</h2>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Principios que guían cada decisión y cada interacción con nuestros clientes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div key={idx} className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 text-center hover:border-data-blue transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-slate-900 dark:border-white text-slate-900 dark:text-white mb-4">
                  {value.icon}
                </div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white mb-2 uppercase">{value.title}</h3>
                <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section ref={processRef} className="py-20 bg-white dark:bg-surface border-t border-b border-slate-900 dark:border-white">
        <div className="w-full px-margin-page">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-4 uppercase">Cómo Trabajamos</h2>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Un proceso diseñado para garantizar eficiencia y satisfacción en cada pedido.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Package className="w-6 h-6" />, step: "01", title: "Selección", desc: "Catálogo curado con productos verificados y disponibles en tiempo real." },
              { icon: <Truck className="w-6 h-6" />, step: "02", title: "Gestión", desc: "Procesamiento ágil de pedidos con seguimiento transparente." },
              { icon: <ShieldCheck className="w-6 h-6" />, step: "03", title: "Entrega", desc: "Logística confiable y soporte post-venta para tu tranquilidad." },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white p-6 h-full">
                  <span className="font-data-label font-data-label text-xs uppercase text-data-blue tracking-wider mb-2 block">{item.step}</span>
                  <div className="inline-flex items-center justify-center w-10 h-10 border border-data-blue text-data-blue mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white mb-2 uppercase">{item.title}</h3>
                  <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[1px] bg-slate-900/20 dark:bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-20">
        <div className="w-full px-margin-page text-center">
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-8 md:p-12">
            <h2 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-4 uppercase">¿Listo para trabajar con nosotros?</h2>
            <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Contáctanos para conocer cómo podemos ayudarte a optimizar tus operaciones con nuestros productos y servicios.
            </p>
            <a href="/contacto" className="btn-precision inline-flex">
              Contactar Ahora
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}