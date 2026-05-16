"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { recoverPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await recoverPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo");
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/20">
          {sent ? <CheckCircle className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{sent ? "Correo Enviado" : "Recuperar Contraseña"}</h1>
        <p className="text-slate-400 text-sm">
          {sent ? `Hemos enviado un enlace de recuperación a ${email}` : "Ingresa tu correo y te enviaremos instrucciones para restablecer tu acceso."}
        </p>
      </div>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all" placeholder="Correo electrónico registrado" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Enviar Enlace <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <button onClick={() => { setSent(false); setEmail(""); }} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors mb-4">
            Enviar a otro correo
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Volver al login
        </Link>
      </div>
    </div>
  );
}