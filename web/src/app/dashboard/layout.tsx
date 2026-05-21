"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Package, DollarSign, Users, Activity, 
  ShieldCheck, LayoutDashboard, LogOut, Menu, X, Moon, Sun, Tag
} from "lucide-react";
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
    // Animación de entrada de la sidebar (solo si los elementos existen)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const links = [
    { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
    { name: "Categorías", href: "/dashboard/categories", icon: Tag },
    { name: "Inventario", href: "/dashboard/inventory", icon: Package },
    { name: "Ventas", href: "/dashboard/sales", icon: DollarSign },
    { name: "Clientes", href: "/dashboard/customers", icon: Users },
  ];

  if (user?.role === "admin") {
    links.push({ name: "Usuarios", href: "/dashboard/users", icon: ShieldCheck });
    links.push({ name: "Auditoría", href: "/dashboard/audit", icon: Activity });
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Botón menú móvil */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-[#111] rounded-xl shadow-lg text-gray-800 dark:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>
 
      {/* Overlay móvil */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full z-50
        w-72 bg-white dark:bg-[#111] border-r border-gray-200 dark:border-[#222] shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Confimax
              </h1>
              <p className="text-xs text-gray-500 font-medium">Enterprise Panel</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#1a1a1a] dark:to-[#111] border border-gray-200 dark:border-[#222]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bienvenido,</p>
            <p className="font-semibold text-lg truncate">{user.name}</p>
            <span className="inline-block mt-2 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 capitalize">
              {user.role}
            </span>
          </div>

          <nav className="space-y-1.5">
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-4">Menú Principal</p>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white'}
                  `}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-100 dark:border-[#222] flex flex-col gap-2">
          <button
            onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
            </div>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
