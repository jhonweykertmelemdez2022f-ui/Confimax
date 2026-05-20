"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Plus, Search, RefreshCw, AlertTriangle, CheckCircle, DollarSign, Calendar } from "lucide-react";
import { gsap } from "gsap";

interface Sale {
  id: string;
  customerId?: string;
  total: number;
  paymentMethod: string;
  created_at: string;
}

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSales();
  }, [user]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await api.getSales() as any;
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      setSales(data.map((s: any) => ({
        id: s.id || String(s.sale_id),
        customerId: s.customerId || s.customer_id,
        total: parseFloat(s.total || s.total_amount || 0),
        paymentMethod: s.paymentMethod || s.payment_method || "Efectivo",
        created_at: s.created_at || new Date().toISOString()
      })));
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(".sale-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, sales]);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Ventas Registradas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Historial completo de transacciones.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadSales()}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          
          <button
            onClick={() => alert("Registrar Venta estará disponible próximamente.")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <CheckCircle className="w-5 h-5 text-blue-500" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-[#222] flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID de Venta..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-[#222]">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Venta</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Método de Pago</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron ventas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="sale-row hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">{sale.id}</p>
                          {sale.customerId && <p className="text-xs text-gray-500 dark:text-gray-400">Cliente: {sale.customerId.substring(0, 8)}...</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#222] dark:text-gray-300 capitalize border border-gray-200 dark:border-[#333]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white text-lg">
                      ${sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
