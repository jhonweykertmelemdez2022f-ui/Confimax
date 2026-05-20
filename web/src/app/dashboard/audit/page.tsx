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

  const filteredLogs = auditLogs.filter(log => 
    (log.action && log.action.toLowerCase().includes(search.toLowerCase())) || 
    (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase())) ||
    (log.username && log.username.toLowerCase().includes(search.toLowerCase()))
  );

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
              placeholder="Buscar por acción, usuario o entidad..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12121a] border border-[#e0e0f0] dark:border-[#2a2a3a] rounded-xl focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] focus:border-transparent outline-none transition-all text-[#0a0a1f] dark:text-[#f0f0ff] text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#12121a] px-4 py-2 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] self-start sm:self-auto shadow-sm">
            <Activity className="w-4 h-4 text-[#5548e0] dark:text-[#6c63ff]" />
            <span className="font-semibold">{filteredLogs.length} eventos registrados</span>
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
                <div key={idx} className="audit-row p-4 rounded-2xl bg-[#fafafe] dark:bg-[#1a1a26] border border-[#e0e0f0] dark:border-[#2a2a3a] hover:border-[#5548e0]/40 dark:hover:border-[#6c63ff]/40 hover:shadow-md transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-[#e0e0f0] dark:border-[#2a2a3a] pb-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                        log.action === 'CREATE' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        log.action === 'UPDATE' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                        log.action === 'DELETE' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' :
                        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span className="text-[#5548e0] dark:text-[#6c63ff] font-bold tracking-wider">{log.entity_type}</span>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">User: {log.username || 'Sistema'}</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 font-medium">
                      {new Date(log.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'medium' })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    {log.old_values && Object.keys(log.old_values).length > 0 && (
                      <div className="bg-[#f5f5ff] dark:bg-[#0a0a0f] p-3 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a]">
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5 block uppercase tracking-wider">Estado Anterior:</span>
                        <pre className="text-xs font-mono text-[#0a0a1f] dark:text-[#f0f0ff]/80 whitespace-pre-wrap break-words max-h-48 overflow-y-auto bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-[#e0e0f0]/60 dark:border-black/30">
                          {JSON.stringify(log.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_values && Object.keys(log.new_values).length > 0 && (
                      <div className="bg-[#f5f5ff] dark:bg-[#0a0a0f] p-3 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] lg:col-start-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 block uppercase tracking-wider">Nuevo Estado:</span>
                        <pre className="text-xs font-mono text-[#0a0a1f] dark:text-[#f0f0ff]/80 whitespace-pre-wrap break-words max-h-48 overflow-y-auto bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-[#e0e0f0]/60 dark:border-black/30">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
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

