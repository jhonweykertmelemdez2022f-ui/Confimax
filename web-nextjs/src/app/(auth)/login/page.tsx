"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/catalogo");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 border border-slate-900 dark:border-white mb-4">
          <ShieldCheck className="w-8 h-8 text-slate-900 dark:text-white" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white mb-2 uppercase">Acceso a Confimax</h1>
        <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm">Ingresa para gestionar tu catálogo y pedidos.</p>
      </div>

      {error && <div className="mb-6 p-3 border border-error text-error font-data-label text-data-label text-xs uppercase text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <label className="font-data-label text-data-label text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md" 
              placeholder="usuario@confimax.com" 
              required 
            />
          </div>
        </div>
        <div className="relative">
          <label className="font-data-label text-data-label text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-3 pl-10 pr-12 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md" 
              placeholder="••••••••" 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" 
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer font-data-label text-data-label text-xs uppercase text-slate-500 dark:text-slate-400">
            <input type="checkbox" className="w-4 h-4 border border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim accent-data-blue" />
            <span>Recordarme</span>
          </label>
          <Link href="/recuperar-password" className="font-data-label text-data-label text-xs uppercase text-data-blue hover:text-slate-900 dark:hover:text-white transition-colors">¿Olvidaste tu contraseña?</Link>
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full btn-precision disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-black dark:border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              INICIAR SESIÓN
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-slate-900/20 dark:border-white/20 text-center">
        <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400 text-sm">
          ¿No tienes cuenta? <Link href="/registro" className="font-data-label text-data-label text-xs uppercase text-data-blue hover:text-slate-900 dark:hover:text-white transition-colors">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}