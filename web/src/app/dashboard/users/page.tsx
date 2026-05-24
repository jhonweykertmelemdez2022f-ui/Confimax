"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";

interface SystemUser {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: string;
}

const ROLE_OPTIONS = [
  { value: 'vendor', label: 'VENDEDOR', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'manager', label: 'GERENTE', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'admin', label: 'ADMIN', color: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    username: "", name: "", email: "", password: "", role: "vendor"
  });

  const listRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/dashboard");
    } else {
      loadUsers();
    }
  }, [user, authLoading, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers() as any;
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      setSystemUsers(data.map((u: any) => ({
        id: u.id,
        username: u.name || u.username || "",
        name: u.name || u.username || "",
        email: u.email || "",
        role: u.role || "vendor"
      })));
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar usuarios del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && listRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.fromTo(".user-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        setSuccessMsg("Usuario actualizado con éxito");
      } else {
        await api.createUser(formData);
        setSuccessMsg("Usuario registrado con éxito");
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: "", name: "", email: "", password: "", role: "vendor" });
      await loadUsers();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar el usuario");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      setLoading(true);
      await api.deleteUser(id);
      setSuccessMsg("Usuario eliminado con éxito");
      await loadUsers();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = systemUsers.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (user?.role !== "admin" && user?.name?.toLowerCase() !== "fabiana") return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-xl text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            USUARIOS DEL SISTEMA
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            ADMINISTRA ACCESOS, ROLES Y PERMISOS DE LA PLATAFORMA.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => loadUsers()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ username: "", name: "", email: "", password: "", role: "vendor" });
              setShowModal(true);
            }}
            className="btn-precision inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white min-h-[44px]"
          >
            <span className="material-symbols-outlined">add</span>
            AÑADIR USUARIO
          </button>
          </div>
      </div>

      {errorMsg && (
        <div className="p-4 border-2 border-error bg-error/10 flex items-center gap-3 text-error">
          <span className="material-symbols-outlined">warning</span>
          <span className="font-data-label font-bold text-sm uppercase">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 border-2 border-data-blue bg-data-blue/10 flex items-center gap-3 text-data-blue">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-data-label font-bold text-sm uppercase">{successMsg}</span>
        </div>
      )}

      <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface relative">
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />

        <div className="p-4 border-b-2 border-slate-900 dark:border-white flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-surface-dim">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="BUSCAR POR NOMBRE O CORREO..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label uppercase tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-data-blue"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="min-h-[44px] px-4 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-xs uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-data-blue"
          >
            <option value="all">TODOS LOS ROLES</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto min-h-[500px]" ref={listRef}>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-surface-dim border-b-2 border-slate-900 dark:border-white">
              <tr>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">USUARIO</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">ROL DE ACCESO</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">EMAIL</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 text-center">CMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                     <span className="material-symbols-outlined text-[48px] text-slate-300 mb-4">search_off</span>
                     <p className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white">SIN RESULTADOS</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleInfo = ROLE_OPTIONS.find(opt => opt.value === u.role) || ROLE_OPTIONS[0];
                  return (
                    <tr key={u.id} className="user-row hover:bg-slate-50 dark:hover:bg-surface-dim transition-colors group">
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-display-xl text-xl font-black">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-headline-lg-mobile text-sm uppercase text-slate-900 dark:text-white">{u.username}</p>
                            {u.name && <p className="font-data-label text-[10px] uppercase text-slate-500">{u.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <span className="font-data-label text-[10px] font-bold tracking-widest uppercase px-2 py-1 border bg-slate-100 dark:bg-surface text-slate-900 dark:text-white">
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <p className="font-data-label text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                          {u.email}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        {u.id !== user?.id && (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingUser(u);
                                setFormData({
                                  username: u.username, name: u.name || "", email: u.email,
                                  password: "", role: u.role
                                });
                                setShowModal(true);
                              }}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(u.id)}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-error text-error bg-error/10 hover:bg-error hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-xl relative">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between shrink-0">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">
                {editingUser ? 'EDITAR USUARIO' : 'AÑADIR USUARIO'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">USERNAME</label>
                  <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">NOMBRE REAL</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">CORREO ELECTRÓNICO</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">CONTRASEÑA {editingUser && '(DEJAR VACÍO PARA NO CAMBIAR)'}</label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">ROL DE ACCESO</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue">
                    <option value="vendor">VENDEDOR</option>
                    <option value="manager">GERENTE</option>
                    <option value="admin">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t-2 border-slate-900 dark:border-white mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="min-h-[44px] px-5 py-2.5 border border-slate-900 dark:border-white font-data-label text-xs tracking-widest uppercase font-bold text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
                  CANCELAR
                </button>
                <button type="submit" disabled={loading} className="min-h-[44px] px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white font-data-label text-xs tracking-widest uppercase font-bold transition-colors disabled:opacity-50">
                  {loading ? 'GUARDANDO...' : 'GUARDAR USUARIO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
