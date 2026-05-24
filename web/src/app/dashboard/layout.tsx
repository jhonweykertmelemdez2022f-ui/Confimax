"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Chatbot from "@/components/Chatbot";
import { useTheme } from "@/context/ThemeContext";
import { gsap } from "gsap";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user?.role === "cliente") {
      router.push("/catalogo");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    if (sidebarLinks.length > 0) {
      gsap.fromTo(".sidebar-link", 
        { x: -20, opacity: 0 }, 
        { x: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <span className="material-symbols-outlined text-[48px] text-data-blue animate-spin">autorenew</span>
      </div>
    );
  }

  const links = [
    { name: "Resumen", href: "/dashboard", icon: "dashboard" },
    { name: "Categorías", href: "/dashboard/categories", icon: "category" },
    { name: "Inventario", href: "/dashboard/inventory", icon: "inventory_2" },
    { name: "Ventas", href: "/dashboard/sales", icon: "attach_money" },
    { name: "Clientes", href: "/dashboard/customers", icon: "group" },
  ];

  if (user?.role === "admin" || user?.name?.toLowerCase() === "fabiana") {
    links.push({ name: "Usuarios", href: "/dashboard/users", icon: "admin_panel_settings" });
    links.push({ name: "Auditoría", href: "/dashboard/audit", icon: "history" });
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-background text-slate-900 dark:text-white font-sans">
      
      {/* Botón menú móvil */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-surface border border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-slate-900 dark:text-white"
      >
        <span className="material-symbols-outlined text-[28px]">menu</span>
      </button>
 
      {/* Overlay móvil */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Brutalist */}
      <aside className={`
        fixed lg:static top-0 left-0 min-h-screen z-50
        w-72 bg-white dark:bg-surface border-r-2 border-slate-900 dark:border-white
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between border-b-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-surface-dim">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-slate-900 dark:border-white bg-data-blue flex items-center justify-center">
              <span className="font-headline-lg text-xl font-bold text-white">C</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-xl font-bold uppercase tracking-tighter leading-none">
                Confimax
              </h1>
              <p className="font-data-label text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-900 dark:border-white relative z-10">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto brutal-scrollbar">
          <div className="mb-6 p-4 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright">
            <p className="font-data-label text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">OPERADOR</p>
            <p className="font-headline-lg-mobile text-lg truncate uppercase leading-none mb-2">{user.name}</p>
            <span className="inline-block px-3 py-1 font-data-label text-[10px] font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent uppercase tracking-widest">
              {user.role}
            </span>
          </div>

          <nav className="space-y-2">
            <p className="px-2 font-data-label text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 mt-4">MÓDULOS DE SISTEMA</p>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    sidebar-link flex items-center gap-3 px-4 py-3 border transition-all duration-200 group
                    ${isActive 
                      ? 'border-slate-900 dark:border-white bg-data-blue text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]' 
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-900/30 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-surface-dim hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'group-hover:text-data-blue'}`}>
                    {link.icon}
                  </span>
                  <span className="font-data-label text-xs font-bold uppercase tracking-widest">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-surface-dim flex flex-col gap-3">
          <button
            onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
            className="w-full flex items-center justify-center lg:justify-between px-3 py-3 border border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors font-data-label text-xs uppercase tracking-widest font-bold"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
              <span className="hidden lg:inline">{theme === "dark" ? "MODO CLARO" : "MODO OSCURO"}</span>
            </div>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 border border-error bg-error/10 text-error hover:bg-error hover:text-white transition-colors font-data-label text-xs uppercase tracking-widest font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] mx-auto w-full relative">
           <div className="hidden lg:block absolute inset-0 z-[-1] pointer-events-none opacity-20 dark:opacity-10 grid-bg"></div>
          {children}
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
