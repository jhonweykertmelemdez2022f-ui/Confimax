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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background p-4 md:p-8">
      <div className="w-full max-w-md bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="font-headline-lg text-headline-lg text-slate-900 dark:text-white uppercase mb-2">Acceso al Sistema</h1>
          <p className="font-body-md text-body-md text-slate-600 dark:text-slate-400">Identifícate para acceder a tu cuenta</p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-error bg-error/10 text-error text-sm font-data-label font-data-label uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-3 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue transition-all font-body-md"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 border-slate-900 dark:border-white" />
              <span className="font-body-sm font-body-sm text-slate-600 dark:text-slate-400">Recordarme</span>
            </label>
            <button type="button" onClick={handleForgotPassword} className="font-data-label font-data-label text-xs text-data-blue hover:text-slate-900 dark:hover:text-white uppercase transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isLoading}
            className="w-full btn-precision disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || isLoading ? "PROCESANDO..." : "INICIAR SESIÓN"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="font-body-sm font-body-sm text-slate-600 dark:text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-data-label font-data-label text-xs text-data-blue hover:text-slate-900 dark:hover:text-white uppercase transition-colors">
              REGÍSTRATE
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 dark:border-white">
          <div className="text-center">
            <span className="font-data-label font-data-label text-xs text-slate-500 dark:text-slate-400 uppercase block mb-3">Ingreso de prueba</span>
            <button
              type="button"
              onClick={() => {
                setEmail("demo@confimax.com");
                setPassword("demo123");
              }}
              className="w-full bg-slate-100 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 font-data-label font-data-label text-xs text-slate-900 dark:text-white uppercase hover:bg-slate-200 dark:hover:bg-surface-bright transition-colors"
            >
              CREDENCIALES DE DEMO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}