"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, recoverPassword, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await recoverPassword(email);
      alert("Se ha enviado un correo con instrucciones para restablecer tu contraseña");
    } catch (err: any) {
      setError(err?.message || "Error al procesar solicitud");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/95 dark:bg-surface/95 border border-slate-900 dark:border-white p-5 md:p-6 backdrop-blur-sm">
        <div className="text-center mb-5">
          <p className="font-data-label text-data-label uppercase text-data-blue mb-2">Clientes Confimax</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-1">Iniciar sesión</h1>
          <p className="font-body-md text-sm text-slate-600 dark:text-slate-400">Entra para revisar tu cuenta y tus compras.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-error bg-error/10 text-error text-sm font-data-label font-data-label uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 border-slate-900 dark:border-white" />
              <span className="font-body-sm font-body-sm text-slate-600 dark:text-slate-400">Recordarme</span>
            </label>
            <button type="button" onClick={handleForgotPassword} className="font-data-label font-data-label text-xs text-data-blue hover:bg-data-blue hover:text-white focus-visible:outline-none focus-visible:bg-data-blue focus-visible:text-white uppercase transition-colors px-2 py-1">
              Recuperar clave
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isLoading}
            className="w-full btn-precision justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || isLoading ? "Procesando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="font-body-sm font-body-sm text-slate-600 dark:text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-data-label font-data-label text-xs text-data-blue hover:bg-data-blue hover:text-white focus-visible:outline-none focus-visible:bg-data-blue focus-visible:text-white uppercase transition-colors px-2 py-1">
              Regístrate
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-900 dark:border-white">
          <div className="text-center">
            <span className="font-data-label font-data-label text-xs text-slate-500 dark:text-slate-400 uppercase block mb-2">Ingreso de prueba</span>
            <button
              type="button"
              onClick={() => {
                setEmail("demo@confimax.com");
                setPassword("demo123");
              }}
              className="w-full bg-slate-100 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 font-data-label font-data-label text-xs text-slate-900 dark:text-white uppercase hover:bg-data-blue hover:text-white hover:border-data-blue focus-visible:outline-none focus-visible:bg-data-blue focus-visible:text-white transition-colors"
            >
              Credenciales de demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
