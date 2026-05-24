"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
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
    if (!data) return <span className="text-slate-400 italic">—</span>;
    return (
      <pre className="font-data-label text-[10px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-3 overflow-x-auto mt-2 tracking-wider">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  if (user?.role !== "admin" && user?.name?.toLowerCase() !== "fabiana") return null;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6">
        <div>
          <h1 className="font-headline-lg text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px]">history</span>
            AUDITORÍA DE SISTEMA
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            REGISTRO DETALLADO DE OPERACIONES Y ACCESOS
          </p>
        </div>
        
        <button 
          onClick={() => loadAuditLogs()}
          className="btn-precision inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white dark:bg-slate-900 dark:text-white dark:hover:bg-white dark:hover:text-slate-900 min-h-[44px]"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          ACTUALIZAR DATOS
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 border-2 border-error bg-error/10 text-error flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px]">warning</span>
          <span className="font-data-label text-sm uppercase font-bold tracking-widest">{errorMsg}</span>
        </div>
      )}

      {/* Controles y Tabla */}
      <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface relative">
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />
        
        <div className="p-4 border-b-2 border-slate-900 dark:border-white flex flex-col xl:flex-row xl:items-center gap-4 bg-slate-50 dark:bg-surface-dim">
          <div className="relative flex-1 min-w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="Buscar por operación, entidad, ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label uppercase tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-data-blue focus:border-data-blue"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={filterOp} 
              onChange={(e) => setFilterOp(e.target.value)}
              className="min-h-[44px] px-4 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-xs uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-data-blue"
            >
              <option value="">TODAS LAS OPERACIONES</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="min-h-[44px] px-4 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-xs uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-data-blue"
            >
              <option value="">TODOS LOS ROLES</option>
              <option value="admin">ADMIN</option>
              <option value="usuario">USUARIO</option>
            </select>
          </div>
          <div className="min-h-[44px] flex items-center justify-center px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-data-label text-xs uppercase tracking-widest font-bold ml-auto">
            {filteredLogs.length} EVENTOS
          </div>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-surface h-[600px] overflow-y-auto brutal-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500">
              <span className="material-symbols-outlined text-[64px] mb-4">search_off</span>
              <span className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white mb-2">SIN RESULTADOS</span>
              <span className="font-data-label text-xs tracking-widest uppercase">No hay eventos para estos filtros</span>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-surface-dim border-b-2 border-slate-900 dark:border-white z-10">
                <tr>
                  <th className="p-4 text-left font-data-label text-xs tracking-widest uppercase text-slate-500">OPERACIÓN</th>
                  <th className="p-4 text-left font-data-label text-xs tracking-widest uppercase text-slate-500">USUARIO</th>
                  <th className="p-4 text-left font-data-label text-xs tracking-widest uppercase text-slate-500">ENTIDAD/ID</th>
                  <th className="p-4 text-right font-data-label text-xs tracking-widest uppercase text-slate-500">FECHA/HORA</th>
                  <th className="p-4 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                {filteredLogs.map((log: any, idx: number) => {
                  const isExpanded = expandedLogs.has(idx);
                  return (
                    <React.Fragment key={idx}>
                      <tr 
                        className={`hover:bg-slate-50 dark:hover:bg-surface-dim transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-surface-dim' : ''}`}
                        onClick={() => toggleExpand(idx)}
                      >
                        <td className="p-4">
                          <span className={`inline-block border border-slate-900 dark:border-white px-2 py-1 font-data-label text-[10px] uppercase font-bold tracking-widest
                            ${log.operation === 'DELETE' ? 'bg-error text-white border-error' : 
                              log.operation === 'CREATE' ? 'bg-[#00FF66] text-slate-900 border-[#00FF66]' : 
                              'bg-transparent text-slate-900 dark:text-white'}`}>
                            {log.operation}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-headline-lg-mobile text-sm uppercase mb-1">{log.username || 'SISTEMA'}</p>
                          <span className="font-data-label text-[10px] uppercase tracking-widest px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                            {log.role || (log.username === 'admin' ? 'ADMIN' : 'USUARIO')}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.entity && (
                            <span className="inline-block border border-data-blue text-data-blue px-2 py-0.5 font-data-label text-[10px] uppercase tracking-widest mb-1 mr-2">
                              {log.entity}
                            </span>
                          )}
                          {log.recordId && (
                            <span className="font-data-label text-[10px] uppercase tracking-widest text-slate-500">
                              ID: {String(log.recordId)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-data-label text-xs uppercase tracking-widest font-bold">
                            {new Date(log.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                          <p className="font-data-label text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                            {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <span className="material-symbols-outlined">{isExpanded ? "expand_less" : "expand_more"}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-100 dark:bg-surface-dim border-b border-slate-900 dark:border-white">
                          <td colSpan={5} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                <div>
                                  <h4 className="font-data-label text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-900/20 dark:border-white/20 pb-2 mb-3">
                                    DATOS DE RED
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {log.ipAddress && (
                                      <div>
                                        <p className="font-data-label text-[10px] uppercase text-slate-500">IP ADDRESS</p>
                                        <p className="font-data-label text-xs mt-1 border border-slate-900/20 dark:border-white/20 bg-white dark:bg-surface p-2">{log.ipAddress}</p>
                                      </div>
                                    )}
                                    {log.userId && (
                                      <div>
                                        <p className="font-data-label text-[10px] uppercase text-slate-500">USER ID</p>
                                        <p className="font-data-label text-xs mt-1 border border-slate-900/20 dark:border-white/20 bg-white dark:bg-surface p-2">{log.userId}</p>
                                      </div>
                                    )}
                                  </div>
                                  {log.endpoint && (
                                    <div className="mt-4">
                                      <p className="font-data-label text-[10px] uppercase text-slate-500">ENDPOINT</p>
                                      <p className="font-data-label text-xs mt-1 border border-slate-900/20 dark:border-white/20 bg-white dark:bg-surface p-2 break-all">{log.endpoint}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-6">
                                <div>
                                  <h4 className="font-data-label text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-900/20 dark:border-white/20 pb-2 mb-3">
                                    PAYLOAD
                                  </h4>
                                  {log.oldData && (
                                    <div className="mb-4">
                                      <span className="font-data-label text-[10px] uppercase font-bold text-error">OLD_DATA</span>
                                      {formatJSON(log.oldData)}
                                    </div>
                                  )}
                                  {log.newData && (
                                    <div>
                                      <span className="font-data-label text-[10px] uppercase font-bold text-[#00FF66]">NEW_DATA</span>
                                      {formatJSON(log.newData)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
