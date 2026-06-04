"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
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
  const hasAnimated = useRef(false);

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
    if (!loading && statsRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.fromTo(statsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-transparent">
        <span className="material-symbols-outlined text-[48px] text-data-blue animate-spin">autorenew</span>
      </div>
    );
  }

  const statCards = [
    { title: "INVENTARIO (SKU)", value: stats.totalProducts, icon: "inventory_2", code: "PRD" },
    { title: "TRANSACCIONES", value: stats.totalSales, icon: "receipt_long", code: "TRX" },
    { title: "CLIENTES REG.", value: stats.totalCustomers, icon: "group", code: "USR" },
    { title: "ALERTAS STOCK", value: stats.lowStockCount, icon: "warning", code: "WRN", isAlert: stats.lowStockCount > 0 }
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-12">
      <div className="pb-4 sm:pb-6">
        <h1 className="font-headline-lg-mobile sm:font-headline-lg text-3xl sm:text-5xl uppercase tracking-tighter text-slate-900 dark:text-white mb-2">PANEL DE CONTROL</h1>
        <p className="font-data-label text-[10px] sm:text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">
          RESUMEN OPERATIVO CONFIMAX
        </p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className={`relative p-5 sm:p-6 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface-bright flex flex-col group transition-all duration-300 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1 ${stat.isAlert ? "border-error shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"}`}>
            <span className={`absolute top-4 right-4 font-data-label text-[9px] sm:text-[10px] tracking-widest border border-slate-900/20 dark:border-white/20 px-2 py-0.5 ${stat.isAlert ? "text-error border-error bg-error/10" : "text-slate-500"}`}>
              {stat.code}
            </span>
            <span className={`material-symbols-outlined text-[28px] sm:text-[32px] mb-4 ${stat.isAlert ? "text-error" : "text-data-blue"}`}>
              {stat.icon}
            </span>
            <h3 className="font-display-xl text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter mb-2">
              {stat.value}
            </h3>
            <p className="font-data-label text-[10px] sm:text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 mt-auto pt-4 border-t border-slate-900/10 dark:border-white/10">
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      {/* Panel de Acciones Rápidas */}
      <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface p-5 sm:p-8 relative">
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />
        
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <span className="material-symbols-outlined text-[24px] text-data-blue">bolt</span>
          <h2 className="font-headline-lg-mobile text-xl sm:text-2xl uppercase tracking-tighter text-slate-900 dark:text-white">ACCIONES RÁPIDAS</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link href="/dashboard/sales" className="flex flex-col border border-slate-900 dark:border-white p-5 sm:p-6 bg-slate-50 dark:bg-surface-dim hover:bg-data-blue hover:text-white transition-colors group min-h-[140px]">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px] mb-4 group-hover:text-white text-slate-900 dark:text-white">shopping_cart</span>
            <h4 className="font-headline-lg-mobile text-base sm:text-lg uppercase tracking-tight mb-2">REGISTRAR VENTA</h4>
            <p className="font-data-label text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 group-hover:text-white/70">Nueva transacción</p>
          </Link>

          {user?.role?.toLowerCase() !== "vendor" && user?.role?.toLowerCase() !== "vendedor" && (
            <Link href="/dashboard/inventory" className="flex flex-col border border-slate-900 dark:border-white p-5 sm:p-6 bg-slate-50 dark:bg-surface-dim hover:bg-data-blue hover:text-white transition-colors group min-h-[140px]">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px] mb-4 group-hover:text-white text-slate-900 dark:text-white">inventory_2</span>
              <h4 className="font-headline-lg-mobile text-base sm:text-lg uppercase tracking-tight mb-2">NUEVO PRODUCTO</h4>
              <p className="font-data-label text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 group-hover:text-white/70">Agregar al inventario</p>
            </Link>
          )}

          <Link href="/dashboard/customers" className="flex flex-col border border-slate-900 dark:border-white p-5 sm:p-6 bg-slate-50 dark:bg-surface-dim hover:bg-data-blue hover:text-white transition-colors group min-h-[140px]">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px] mb-4 group-hover:text-white text-slate-900 dark:text-white">person_add</span>
            <h4 className="font-headline-lg-mobile text-base sm:text-lg uppercase tracking-tight mb-2">NUEVO CLIENTE</h4>
            <p className="font-data-label text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 group-hover:text-white/70">Registro en directorio</p>
          </Link>

          {user?.role === "admin" && (
            <Link href="/dashboard/users" className="flex flex-col border border-slate-900 dark:border-white p-5 sm:p-6 bg-slate-50 dark:bg-surface-dim hover:bg-data-blue hover:text-white transition-colors group min-h-[140px]">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px] mb-4 group-hover:text-white text-slate-900 dark:text-white">admin_panel_settings</span>
              <h4 className="font-headline-lg-mobile text-base sm:text-lg uppercase tracking-tight mb-2">AÑADIR USUARIO</h4>
              <p className="font-data-label text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 group-hover:text-white/70">Control de acceso</p>
            </Link>
          )}
        </div>
      </div>

      {/* Actividad y Atención Requerida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface p-6 relative">
          <div className="crosshair-tl" />
          <div className="flex items-center gap-3 mb-6 border-b border-slate-900/20 dark:border-white/20 pb-4">
            <span className="material-symbols-outlined text-[24px] text-slate-900 dark:text-white">timeline</span>
            <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter text-slate-900 dark:text-white">ACTIVIDAD RECIENTE</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-surface-dim border border-slate-900/10 dark:border-white/10">
            <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-700 mb-4">insights</span>
            <p className="font-data-label text-xs uppercase tracking-widest text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-surface p-2">MÓDULO DE GRÁFICAS EN DESARROLLO</p>
          </div>
        </div>

        <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface p-6 relative">
          <div className="crosshair-tr" />
          <div className="flex items-center gap-3 mb-6 border-b border-slate-900/20 dark:border-white/20 pb-4">
            <span className="material-symbols-outlined text-[24px] text-error">notification_important</span>
            <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter text-slate-900 dark:text-white">ATENCIÓN REQUERIDA</h2>
          </div>
          
          {stats.lowStockCount > 0 ? (
            <div className="p-6 border-2 border-error bg-error/5 flex items-start gap-4">
              <span className="material-symbols-outlined text-[32px] text-error">warning</span>
              <div>
                <h4 className="font-headline-lg-mobile text-lg uppercase tracking-tight text-error mb-1">STOCK CRÍTICO</h4>
                <p className="font-body-md text-slate-700 dark:text-slate-300">Se detectaron <strong className="font-data-label font-bold mx-1 bg-error text-white px-2 py-0.5">{stats.lowStockCount}</strong> artículos con inventario bajo. Reabastecer inmediatamente.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-surface-dim border border-slate-900/10 dark:border-white/10">
              <span className="material-symbols-outlined text-[48px] text-[#00FF66] mb-4">check_circle</span>
              <p className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white mb-2">TODO EN ORDEN</p>
              <p className="font-data-label text-xs uppercase tracking-widest text-slate-500">STOCK SALUDABLE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
