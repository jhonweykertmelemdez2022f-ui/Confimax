"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    
    try {
      await register(name, email, password);
      router.push("/catalogo");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/95 dark:bg-surface/95 border border-slate-900 dark:border-white p-5 md:p-6 backdrop-blur-sm">
        <div className="text-center mb-5">
          <p className="font-data-label text-data-label uppercase text-data-blue mb-2">Clientes Confimax</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-slate-900 dark:text-white uppercase mb-1">Crear cuenta</h1>
          <p className="font-body-md text-sm text-slate-600 dark:text-slate-400">Regístrate para guardar tus datos y consultar tus compras.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-error bg-error/10 text-error text-sm font-data-label font-data-label uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md"
              placeholder="Tu nombre"
              required
            />
          </div>

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 px-4 pr-12 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-data-label font-data-label text-xs uppercase text-slate-500 dark:text-slate-300 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-data-blue focus:ring-1 focus:ring-data-blue transition-all font-body-md"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-precision justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2"
          >
            {isLoading ? "Procesando..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-900 dark:border-white text-center">
          <p className="font-body-sm font-body-sm text-slate-600 dark:text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-data-label font-data-label text-xs text-data-blue hover:bg-data-blue hover:text-white focus-visible:outline-none focus-visible:bg-data-blue focus-visible:text-white uppercase transition-colors px-2 py-1">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
