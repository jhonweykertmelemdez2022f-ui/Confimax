"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Search, RefreshCw, AlertTriangle, Terminal, Activity, Eye, EyeOff } from "lucide-react";
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
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

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

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (log.operation && log.operation.toLowerCase().includes(search.toLowerCase())) || 
                          (log.entity && log.entity.toLowerCase().includes(search.toLowerCase())) ||
                          (log.username && log.username.toLowerCase().includes(search.toLowerCase())) ||
                          (log.recordId && String(log.recordId).toLowerCase().includes(search.toLowerCase()));
    const matchesOp = filterOp ? log.operation === filterOp : true;
    const logRole = log.role || (log.username === 'admin' ? 'admin' : 'usuario');
    const matchesRole = filterRole ? logRole === filterRole : true;
    return matchesSearch && matchesOp && matchesRole;
  });

  const formatJSON = (data: any) => {
    if (!data) return <span className="text-gray-400 italic">—</span>;
    return (
      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mt-2 text-gray-700 dark:text-gray-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  const getOperationColor = (op: string) => {
    switch(op) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'LOGIN': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Terminal className="w-8 h-8 text-purple-500" />
            Auditoría del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro detallado de todas las operaciones realizadas.</p>
        </div>
        
        <button 
          onClick={() => loadAuditLogs()}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors rounded-xl font-medium shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : 'text-gray-500 dark:text-gray-400'}`} />
          <span className="font-semibold">Actualizar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-[#333] shadow-sm overflow-hidden flex flex-col h-[750px]">
        <div className="p-4 border-b border-gray-200 dark:border-[#333] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50 dark:bg-[#151515]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por operación, entidad, usuario o ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterOp} 
              onChange={(e) => setFilterOp(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm outline-none text-gray-700 dark:text-gray-300"
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
              className="px-3 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm outline-none text-gray-700 dark:text-gray-300"
            >
              <option value="">Todos los Roles</option>
              <option value="admin">Admin</option>
              <option value="usuario">Usuario</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#111] px-4 py-2 rounded-xl border border-gray-200 dark:border-[#333] self-start sm:self-auto shadow-sm">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="font-semibold">{filteredLogs.length} eventos</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a] p-4" ref={listRef}>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
              <Activity className="w-10 h-10 stroke-[1.5]" />
              <span>No hay eventos que coincidan con la búsqueda.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#333] overflow-hidden hover:border-purple-500/40 dark:hover:border-purple-500/40 hover:shadow-md transition-all"
                >
                  {/* Cabecera del log */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(idx)}>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border ${getOperationColor(log.operation)}`}>
                        {log.operation}
                      </span>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {log.username || 'Sistema'} 
                          <span className="text-xs font-normal text-gray-500 ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                            Rol: {log.role || (log.username === 'admin' ? 'admin' : 'usuario')}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {log.entity && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-md font-medium">
                                {log.entity}
                              </span>
                            </span>
                          )}
                          {log.recordId && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              ID: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{String(log.recordId)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(log.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {expandedLogs.has(idx) ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  {expandedLogs.has(idx) && (
                    <div className="border-t border-gray-200 dark:border-[#333] p-4 bg-gray-50 dark:bg-[#0a0a0a]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna izquierda: datos técnicos */}
                        <div className="space-y-4">
                          {log.ipAddress && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Dirección IP</h4>
                              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333]">
                                {log.ipAddress}
                              </p>
                            </div>
                          )}
                          {log.endpoint && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Endpoint</h4>
                              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] break-all">
                                {log.endpoint}
                              </p>
                            </div>
                          )}
                          {log.userAgent && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">User Agent</h4>
                              <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] break-all">
                                {log.userAgent}
                              </p>
                            </div>
                          )}
                          {log.userId && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">User ID</h4>
                              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333]">
                                {log.userId}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Columna derecha: datos del registro */}
                        <div className="space-y-4">
                          {log.oldData && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Datos Anteriores
                              </h4>
                              {formatJSON(log.oldData)}
                            </div>
                          )}
                          {log.newData && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Datos Nuevos
                              </h4>
                              {formatJSON(log.newData)}
                            </div>
                          )}
                          {log.errorMessage && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-xl">
                              <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Error</h4>
                              <p className="text-sm text-red-600 dark:text-red-300">{log.errorMessage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
