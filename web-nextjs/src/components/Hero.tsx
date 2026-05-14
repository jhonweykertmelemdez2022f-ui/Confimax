"use client";

import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl floating" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary-400/20 to-primary-400/20 rounded-full blur-3xl floating-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-300/10 to-secondary-300/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(14 165 233 / 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full category-badge mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Nueva Colección 2024</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight animate-slide-up">
              Descubre el futuro del{" "}
              <span className="gradient-text">e-commerce</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              En Confimax encontrarás tecnología de vanguardia, inventario en tiempo real y una experiencia de compra diseñada para ti.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <a
                href="#catalog"
                className="btn-primary px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary-500/25"
              >
                Explorar Catálogo
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#offers"
                className="btn-secondary px-8 py-4 rounded-xl text-slate-700 font-semibold text-lg flex items-center justify-center"
              >
                Ver Ofertas
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-200/50 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              {[
                { value: "10K+", label: "Productos" },
                { value: "99.9%", label: "Satisfacción" },
                { value: "24/7", label: "Soporte" }
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div className="relative hidden lg:block">
            <div className="relative z-10">
              {/* Main Product Showcase */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl blur-2xl opacity-20 floating" />
                
                <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-300/50 p-6 border border-slate-200/50">
                  {/* Product Preview Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "Auriculares Pro", price: "$149.99", color: "from-blue-500 to-cyan-500" },
                      { name: "Smartwatch", price: "$299.99", color: "from-purple-500 to-pink-500" },
                      { name: "Cámara 4K", price: "$899.99", color: "from-orange-500 to-red-500" },
                      { name: "Tablet Pro", price: "$799.99", color: "from-green-500 to-emerald-500" }
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className="group relative p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-primary-300 transition-all cursor-pointer card-hover"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`w-full h-24 rounded-xl bg-gradient-to-br ${item.color} mb-3 flex items-center justify-center`}>
                          <Sparkles className="w-8 h-8 text-white/80" />
                        </div>
                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                        <p className="text-primary-600 font-semibold">{item.price}</p>
                        
                        {/* Quick Add Button */}
                        <button className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 p-4 rounded-2xl bg-white shadow-xl shadow-slate-300/50 border border-slate-200 floating-delay">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Envío Gratis</p>
                    <p className="text-xs text-slate-500">En +$50</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 p-4 rounded-2xl bg-white shadow-xl shadow-slate-300/50 border border-slate-200 floating-delay-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">4.9/5</p>
                    <p className="text-xs text-slate-500">2.5k reseñas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '1s' }}>
        <span className="text-sm text-slate-400">Explorar</span>
        <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center">
          <div className="w-1.5 h-3 bg-slate-400 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
