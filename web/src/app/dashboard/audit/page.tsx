"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Search, RefreshCw, AlertTriangle, Terminal, Activity } from "lucide-react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";

export default function AuditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOp, setFilterOp] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/dashboard");
    } else {
      loadAuditLogs();
    }
  }, [user, authLoading, router]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs() as any;
      const logs = Array.isArray(res.data || res) ? (res.data || res) : [];
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar registros de auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.fromTo(".audit-row",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, duration: 0.3, ease: "power1.out" }
      );
    }
  }, [loading, auditLogs]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (log.operation && log.operation.toLowerCase().includes(search.toLowerCase())) || 
                          (log.entity && log.entity.toLowerCase().includes(search.toLowerCase())) ||
                          (log.username && log.username.toLowerCase().includes(search.toLowerCase()));
    const matchesOp = filterOp ? log.operation === filterOp : true;
    const logRole = log.role || (log.username === 'admin' ? 'admin' : 'usuario');
    const matchesRole = filterRole ? logRole === filterRole : true;
    return matchesSearch && matchesOp && matchesRole;
  });

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a1f] dark:text-[#f0f0ff] flex items-center gap-3">
            <Terminal className="w-8 h-8 text-[#5548e0] dark:text-[#6c63ff]" />
            Auditoría del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Telemetría y registro de operaciones en la base de datos.</p>
        </div>
        
        <button 
          onClick={() => loadAuditLogs()}
          className="flex items-center gap-2 px-5 py-2.5 border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#fafafe] dark:bg-[#1a1a26] text-gray-700 dark:text-gray-200 hover:bg-[#5548e0]/10 dark:hover:bg-[#6c63ff]/10 transition-colors rounded-xl font-medium shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#5548e0] dark:text-[#6c63ff]' : 'text-gray-500 dark:text-gray-400'}`} />
          <span className="font-semibold">Actualizar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="bg-[#fafafe] dark:bg-[#1a1a26] rounded-3xl border border-[#e0e0f0] dark:border-[#2a2a3a] shadow-sm overflow-hidden flex flex-col h-[700px]">
        <div className="p-4 border-b border-[#e0e0f0] dark:border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#f5f5ff] dark:bg-[#12121a]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12121a] border border-[#e0e0f0] dark:border-[#2a2a3a] rounded-xl focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] focus:border-transparent outline-none transition-all text-[#0a0a1f] dark:text-[#f0f0ff] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterOp} 
              onChange={(e) => setFilterOp(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-[#12121a] border border-[#e0e0f0] dark:border-[#2a2a3a] rounded-xl text-sm outline-none"
            >
              <option value="">Todas las Operaciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Login</option>
            </select>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-[#12121a] border border-[#e0e0f0] dark:border-[#2a2a3a] rounded-xl text-sm outline-none"
            >
              <option value="">Todos los Roles</option>
              <option value="admin">Admin</option>
              <option value="usuario">Usuario</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#12121a] px-4 py-2 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] self-start sm:self-auto shadow-sm">
            <Activity className="w-4 h-4 text-[#5548e0] dark:text-[#6c63ff]" />
            <span className="font-semibold">{filteredLogs.length} eventos</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-[#12121a] p-4" ref={listRef}>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
              <Activity className="w-10 h-10 stroke-[1.5]" />
              <span>No hay eventos que coincidan con la búsqueda.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log: any, idx: number) => (
                <div key={idx} className="audit-row p-4 rounded-2xl bg-[#fafafe] dark:bg-[#1a1a26] border border-[#e0e0f0] dark:border-[#2a2a3a] hover:border-[#5548e0]/40 dark:hover:border-[#6c63ff]/40 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border ${
                      log.operation === 'CREATE' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                      log.operation === 'UPDATE' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                      log.operation === 'DELETE' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
                    }`}>
                      {log.operation}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a1f] dark:text-[#f0f0ff]">
                        {log.username || 'Sistema'} 
                        <span className="text-xs font-normal text-gray-500 ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                          Rol: {log.role || (log.username === 'admin' ? 'admin' : 'usuario')}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Entidad afectada: <span className="font-medium text-[#5548e0] dark:text-[#6c63ff]">{log.entity}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(log.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

