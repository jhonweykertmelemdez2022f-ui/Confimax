"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { gsap } from "gsap";

export default function ContactoPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animación del header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animación del formulario
    if (formRef.current) {
      gsap.fromTo(formRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const newErr = { ...prev }; delete newErr[name]; return newErr; });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (!formData.email.trim()) newErrors.email = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Correo inválido";
    if (!formData.message.trim()) newErrors.message = "El mensaje es requerido";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // Simular envío
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    { icon: <MapPin className="w-5 h-5" />, label: "Dirección", value: "Av. Principal 123, Zona Centro" },
    { icon: <Phone className="w-5 h-5" />, label: "Teléfono", value: "+58 212 123 4567" },
    { icon: <Mail className="w-5 h-5" />, label: "Email", value: "ventas@confimax.com" },
    { icon: <Clock className="w-5 h-5" />, label: "Horario", value: "Lun-Vie: 8:00-18:00, Sáb: 9:00-13:00" },
  ];

  return (
    <main className="min-h-screen pt-12 pb-20 bg-white dark:bg-background">
      <div className="w-full px-margin-page">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-4 uppercase">Contáctanos</h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Escríbenos para consultar precios, disponibilidad o pedidos para tu hogar.
          </p>
        </div>

        <div ref={formRef} className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-6">Información de Contacto</h2>
              <div className="space-y-4">
                {contactInfo.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="p-2 border border-data-blue text-data-blue flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="font-body-md font-body-md text-slate-900 dark:text-white font-data-value">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-4">Ubicación</h2>
              <div className="aspect-video bg-slate-50 dark:bg-surface-dim border border-slate-900/20 dark:border-white/20 flex items-center justify-center text-slate-500">
                <MapPin className="w-8 h-8 mr-2" />
                <span className="font-data-label font-data-label text-xs uppercase">Mapa interactivo</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-[#00FF66] text-[#00FF66] mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-2">¡Mensaje Enviado!</h3>
                <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 mb-6">Gracias por contactarnos. Te responderemos en menos de 24 horas.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="font-data-label font-data-label text-data-blue hover:text-slate-900 dark:hover:text-white transition-colors uppercase"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Nombre Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 dark:bg-surface-dim border py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md ${errors.name ? "border-error" : "border-slate-900 dark:border-white"}`}
                    placeholder="Tu nombre"
                  />
                  {errors.name && <p className="mt-1 font-data-label font-data-label text-xs text-error uppercase">{errors.name}</p>}
                </div>

                <div>
                  <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 dark:bg-surface-dim border py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md ${errors.email ? "border-error" : "border-slate-900 dark:border-white"}`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="mt-1 font-data-label font-data-label text-xs text-error uppercase">{errors.email}</p>}
                </div>

                <div>
                  <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Asunto</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-data-blue transition-all font-body-md"
                  >
                    <option value="">Selecciona un tema</option>
                    <option value="ventas">Consulta de Ventas</option>
                    <option value="pedido">Consulta de Pedido</option>
                    <option value="cotizacion">Solicitud de Precios</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Mensaje *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full bg-slate-50 dark:bg-surface-dim border py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all resize-none font-body-md ${errors.message ? "border-error" : "border-slate-900 dark:border-white"}`}
                    placeholder="Describe tu consulta..."
                  />
                  {errors.message && <p className="mt-1 font-data-label font-data-label text-xs text-error uppercase">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full btn-precision"
                >
                  <Send className="w-5 h-5" />
                  Enviar Mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
