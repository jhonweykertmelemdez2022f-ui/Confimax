"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Package, DollarSign, Users, AlertTriangle, Activity } from "lucide-react";
import { gsap } from "gsap";

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
      const [productsRes, salesRes, customersRes] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getSales().catch(() => []),
        api.getCustomers().catch(() => [])
      ]);

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
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Productos", value: stats.totalProducts, icon: Package, color: "from-blue-500 to-cyan-400" },
    { title: "Ventas Registradas", value: stats.totalSales, icon: DollarSign, color: "from-green-500 to-emerald-400" },
    { title: "Clientes", value: stats.totalCustomers, icon: Users, color: "from-purple-500 to-fuchsia-400" },
    { title: "Alertas de Stock", value: stats.lowStockCount, icon: AlertTriangle, color: "from-orange-500 to-red-400" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Panel General</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenido al resumen de la plataforma Confimax.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <img src="/confimax-fondo-animado.png" className="w-32 h-32 object-cover opacity-50 grayscale mb-4" alt="No data" />
            <p className="text-gray-500 dark:text-gray-400">Las gráficas y actividad en tiempo real estarán disponibles pronto.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atención Requerida</h2>
          </div>
          {stats.lowStockCount > 0 ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-400">Stock Bajo Detectado</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">Hay {stats.lowStockCount} producto(s) con inventario bajo. Revisa la sección de Inventario para reabastecer.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
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
