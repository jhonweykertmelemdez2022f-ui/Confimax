"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { 
  Package, DollarSign, Users, Activity, Plus, 
  ShoppingCart, UserPlus, ShieldAlert, CheckCircle2 
} from "lucide-react";
import { gsap } from "gsap";
import Link from "next/link";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    lowStockCount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOverviewData();
  }, [user]);

  const loadOverviewData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [productsRes, salesRes, customersRes] = (await Promise.all([
        api.getProducts().catch(() => []),
        api.getSales().catch(() => []),
        api.getCustomers().catch(() => [])
      ])) as any[];

      const products = Array.isArray(productsRes.data || productsRes) ? (productsRes.data || productsRes) : [];
      const sales = Array.isArray(salesRes.data || salesRes) ? (salesRes.data || salesRes) : [];
      const customers = Array.isArray(customersRes.data || customersRes) ? (customersRes.data || customersRes) : [];

      setStats({
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length,
        lowStockCount: products.filter((p: any) => parseInt(p.stock || p.stock_quantity || 0) < 10).length
      });

    } catch (err) {
      console.error("Error loading overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && statsRef.current) {
      gsap.fromTo(statsRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.2)" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Productos", value: stats.totalProducts, icon: Package, color: "from-blue-500 to-indigo-500" },
    { title: "Ventas Registradas", value: stats.totalSales, icon: DollarSign, color: "from-purple-600 to-indigo-500" },
    { title: "Clientes", value: stats.totalCustomers, icon: Users, color: "from-indigo-600 to-blue-500" },
    { title: "Alertas de Stock", value: stats.lowStockCount, icon: ShieldAlert, color: "from-slate-600 to-indigo-800" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Panel General</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenido al resumen de la plataforma Confimax.</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card relative overflow-hidden bg-white dark:bg-[#111] rounded-3xl p-6 border border-gray-100 dark:border-[#222] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-10 dark:opacity-20 -mr-10 -mt-10 pointer-events-none`}></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} shadow-lg text-white`}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel de Acciones Rápidas */}
      <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Plus className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acciones Rápidas</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/sales" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#222] bg-gray-50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 dark:bg-[#161616] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors">Registrar Venta</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">Generar nueva transacción</p>
            </div>
          </Link>

          <Link href="/dashboard/inventory" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#222] bg-gray-50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 dark:bg-[#161616] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors">Nuevo Producto</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">Agregar item al inventario</p>
            </div>
          </Link>

          <Link href="/dashboard/customers" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#222] bg-gray-50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 dark:bg-[#161616] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors">Nuevo Cliente</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">Registrar en el directorio</p>
            </div>
          </Link>

          {user?.role === "admin" && (
            <Link href="/dashboard/users" className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#222] bg-gray-50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 dark:bg-[#161616] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-white transition-colors">Añadir Usuario</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">Administrar accesos de personal</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Actividad y Atención Requerida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-32 h-32 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center opacity-50 mb-4">
              <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Las gráficas y actividad en tiempo real estarán disponibles pronto.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atención Requerida</h2>
          </div>
          {stats.lowStockCount > 0 ? (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-400">Stock Bajo Detectado</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">Hay {stats.lowStockCount} producto(s) con inventario bajo. Revisa la sección de Inventario para reabastecer.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Todo está en orden.</p>
              <p className="text-sm text-gray-400 mt-1">El stock es saludable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
