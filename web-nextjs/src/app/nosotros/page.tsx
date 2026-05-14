import { ShieldCheck, Target, Users, Award, Truck, Package } from "lucide-react";

export default function NosotrosPage() {
  const values = [
    { icon: <ShieldCheck className="w-8 h-8" />, title: "Calidad Garantizada", desc: "Cada producto pasa por estrictos controles antes de llegar a ti." },
    { icon: <Target className="w-8 h-8" />, title: "Enfoque en Resultados", desc: "Soluciones diseñadas para optimizar tus procesos y maximizar eficiencia." },
    { icon: <Users className="w-8 h-8" />, title: "Compromiso Humano", desc: "Un equipo dedicado a entender y resolver tus necesidades específicas." },
    { icon: <Award className="w-8 h-8" />, title: "Excelencia Continua", desc: "Mejora constante en productos, servicios y experiencia de cliente." },
  ];

  const stats = [
    { value: "12+", label: "Años de experiencia" },
    { value: "5000+", label: "Clientes satisfechos" },
    { value: "2000+", label: "Productos en catálogo" },
    { value: "98%", label: "Tasa de satisfacción" },
  ];

  return (
    <main className="min-h-screen pt-12 pb-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Sobre Confimax</h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Somos una empresa dedicada a proveer soluciones integrales en productos industriales, tecnológicos y de oficina. 
            Nuestra misión es conectar a las empresas con las herramientas que necesitan para crecer.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Nuestros Valores</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Principios que guían cada decisión y cada interacción con nuestros clientes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/30 transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-slate-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Cómo Trabajamos</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Un proceso diseñado para garantizar eficiencia y satisfacción en cada pedido.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Package className="w-6 h-6" />, step: "01", title: "Selección", desc: "Catálogo curado con productos verificados y disponibles en tiempo real." },
              { icon: <Truck className="w-6 h-6" />, step: "02", title: "Gestión", desc: "Procesamiento ágil de pedidos con seguimiento transparente." },
              { icon: <ShieldCheck className="w-6 h-6" />, step: "03", title: "Entrega", desc: "Logística confiable y soporte post-venta para tu tranquilidad." },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider mb-2 block">{item.step}</span>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-800" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Listo para trabajar con nosotros?</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Contáctanos para conocer cómo podemos ayudarte a optimizar tus operaciones con nuestros productos y servicios.
            </p>
            <a href="/contacto" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
              Contactar Ahora
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}