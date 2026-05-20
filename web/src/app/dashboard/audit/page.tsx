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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Terminal className="w-8 h-8 text-green-500" />
            Auditoría del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Telemetría y registro de operaciones en la base de datos.</p>
        </div>
        
        <button 
          onClick={() => loadAuditLogs()}
          className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-green-500' : ''}`} />
          <span className="font-medium">Actualizar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden flex flex-col h-[700px]">
        <div className="p-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por acción, usuario o entidad..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#333]">
            <Activity className="w-4 h-4 text-green-500" />
            <span>{filteredLogs.length} eventos registrados</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-900 text-gray-300 p-4 font-mono text-sm" ref={listRef}>
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No hay eventos que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log: any, idx: number) => (
                <div key={idx} className="audit-row p-3 rounded-lg bg-[#111] border border-[#222] hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center justify-between mb-2 border-b border-[#222] pb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        log.action === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                        log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                        log.action === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-purple-400 font-bold">{log.entity_type}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-yellow-400">User: {log.username || 'Sistema'}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    {log.old_values && Object.keys(log.old_values).length > 0 && (
                      <div className="bg-[#0a0a0a] p-2 rounded border border-[#222]">
                        <span className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Estado Anterior:</span>
                        <pre className="text-xs text-red-400 whitespace-pre-wrap break-words">
                          {JSON.stringify(log.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_values && Object.keys(log.new_values).length > 0 && (
                      <div className="bg-[#0a0a0a] p-2 rounded border border-[#222] lg:col-start-2">
                        <span className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Nuevo Estado:</span>
                        <pre className="text-xs text-green-400 whitespace-pre-wrap break-words">
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
