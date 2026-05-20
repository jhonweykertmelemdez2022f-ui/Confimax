"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Plus, Search, RefreshCw, AlertTriangle, CheckCircle, ShieldCheck, UserCog } from "lucide-react";
import { SquarePenIcon, DeleteIcon } from "@/components/AnimatedIcons";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";

interface SystemUser {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    username: "", name: "", email: "", password: "", role: "vendor"
  });

  const listRef = useRef<HTMLDivElement>(null);

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
    if (!loading && listRef.current) {
      gsap.fromTo(".user-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, systemUsers]);

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

  const filteredUsers = systemUsers.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a1f] dark:text-[#f0f0ff] flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#5548e0] dark:text-[#6c63ff]" />
            Usuarios del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Administra accesos, roles y permisos de la plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadUsers()}
            className="p-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#fafafe] dark:bg-[#1a1a26] text-gray-600 dark:text-gray-300 hover:bg-[#5548e0]/10 dark:hover:bg-[#6c63ff]/10 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#5548e0] dark:text-[#6c63ff]' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ username: "", name: "", email: "", password: "", role: "vendor" });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5548e0] to-[#e84d8a] dark:from-[#6c63ff] dark:to-[#ff6b9d] text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg shadow-[#5548e0]/20 dark:shadow-[#6c63ff]/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Añadir Usuario</span>
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
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="bg-[#fafafe] dark:bg-[#1a1a26] rounded-3xl border border-[#e0e0f0] dark:border-[#2a2a3a] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e0e0f0] dark:border-[#2a2a3a] flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar usuario por nombre o correo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12121a] border border-[#e0e0f0] dark:border-[#2a2a3a] rounded-xl focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] focus:border-transparent outline-none transition-all text-[#0a0a1f] dark:text-[#f0f0ff]"
            />
          </div>
        </div>

        <div className="overflow-x-auto" ref={listRef}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f5ff] dark:bg-[#12121a] border-b border-[#e0e0f0] dark:border-[#2a2a3a]">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol de Acceso</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0f0] dark:divide-[#2a2a3a]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron usuarios en el sistema.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="user-row hover:bg-[#5548e0]/5 dark:hover:bg-[#6c63ff]/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5548e0] to-[#e84d8a] dark:from-[#6c63ff] dark:to-[#ff6b9d] text-white flex items-center justify-center font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{u.username}</p>
                          {u.name && <p className="text-xs text-gray-500 dark:text-gray-400">{u.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        u.role === 'admin' 
                          ? 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
                          : u.role === 'manager'
                          ? 'bg-[#e84d8a]/10 text-[#e84d8a] border-[#e84d8a]/20 dark:bg-[#ff6b9d]/10 dark:text-[#ff6b9d] dark:border-[#ff6b9d]/20'
                          : 'bg-[#5548e0]/10 text-[#5548e0] border-[#5548e0]/20 dark:bg-[#6c63ff]/10 dark:text-[#6c63ff] dark:border-[#6c63ff]/20'
                      }`}>
                        {u.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {u.role === 'manager' && <UserCog className="w-3.5 h-3.5" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {u.email}
                    </td>
                    <td className="p-4 text-right">
                      {u.id !== user?.id && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingUser(u);
                              setFormData({
                                username: u.username, name: u.name || "", email: u.email,
                                password: "", role: u.role
                              });
                              setShowModal(true);
                            }}
                            className="p-2 text-[#5548e0] dark:text-[#6c63ff] hover:bg-[#5548e0]/10 dark:hover:bg-[#6c63ff]/10 rounded-lg transition-colors"
                          >
                            <SquarePenIcon />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1a1a26] rounded-3xl w-full max-w-xl shadow-2xl border border-[#e0e0f0] dark:border-[#2a2a3a] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e0e0f0] dark:border-[#2a2a3a] flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Editar Usuario' : 'Añadir Usuario'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#f5f5ff]/50 dark:bg-[#12121a] text-[#0a0a1f] dark:text-[#f0f0ff] focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Real</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#f5f5ff]/50 dark:bg-[#12121a] text-[#0a0a1f] dark:text-[#f0f0ff] focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#f5f5ff]/50 dark:bg-[#12121a] text-[#0a0a1f] dark:text-[#f0f0ff] focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña {editingUser && '(Dejar vacío para no cambiar)'}</label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#f5f5ff]/50 dark:bg-[#12121a] text-[#0a0a1f] dark:text-[#f0f0ff] focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol de Acceso</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0f0] dark:border-[#2a2a3a] bg-[#f5f5ff]/50 dark:bg-[#12121a] text-[#0a0a1f] dark:text-[#f0f0ff] focus:ring-2 focus:ring-[#5548e0] dark:focus:ring-[#6c63ff] outline-none">
                    <option value="vendor">Vendedor</option>
                    <option value="manager">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[#e0e0f0] dark:border-[#2a2a3a]">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-[#e0e0f0] dark:hover:bg-[#2a2a3a]">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-[#5548e0] to-[#e84d8a] dark:from-[#6c63ff] dark:to-[#ff6b9d] shadow-md shadow-[#5548e0]/20 dark:shadow-[#6c63ff]/20 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
