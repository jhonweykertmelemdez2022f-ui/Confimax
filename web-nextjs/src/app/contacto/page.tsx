"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function ContactoPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    { icon: <MapPin className="w-5 h-5" />, label: "Dirección", value: "Av. Principal 123, Ciudad Empresarial" },
    { icon: <Phone className="w-5 h-5" />, label: "Teléfono", value: "+58 212 123 4567" },
    { icon: <Mail className="w-5 h-5" />, label: "Email", value: "ventas@confimax.com" },
    { icon: <Clock className="w-5 h-5" />, label: "Horario", value: "Lun-Vie: 8:00-18:00, Sáb: 9:00-13:00" },
  ];

  return (
    <main className="min-h-screen pt-12 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Contáctanos</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos tu consulta y nuestro equipo comercial te responderá a la brevedad.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Información de Contacto</h2>
              <div className="space-y-4">
                {contactInfo.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <p className="text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Ubicación</h2>
              <div className="aspect-video bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500">
                <MapPin className="w-8 h-8 mr-2" />
                <span>Mapa interactivo</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">¡Mensaje Enviado!</h3>
                <p className="text-slate-400 mb-6">Gracias por contactarnos. Te responderemos en menos de 24 horas.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-slate-800/50 border rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${errors.name ? "border-red-500" : "border-slate-700 focus:border-cyan-500"}`}
                    placeholder="Tu nombre"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-slate-800/50 border rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${errors.email ? "border-red-500" : "border-slate-700 focus:border-cyan-500"}`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Asunto</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  >
                    <option value="">Selecciona un tema</option>
                    <option value="ventas">Consulta de Ventas</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="cotizacion">Solicitud de Cotización</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mensaje *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full bg-slate-800/50 border rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none ${errors.message ? "border-red-500" : "border-slate-700 focus:border-cyan-500"}`}
                    placeholder="Describe tu consulta..."
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-2"
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