"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Tag, SquarePenIcon, DeleteIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories() as any;
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      setCategories(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        setSuccessMsg("Categoría actualizada con éxito");
      } else {
        await api.createCategory(formData);
        setSuccessMsg("Categoría creada con éxito");
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      await loadCategories();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar la categoría");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      setLoading(true);
      await api.deleteCategory(id);
      setSuccessMsg("Categoría eliminada con éxito");
      await loadCategories();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mensajes de Error y Éxito - Por encima del modal */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center gap-3 text-blue-600 dark:text-blue-400 shadow-xl">
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <Tag className="w-8 h-8 text-purple-500" />
              Categorías
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las categorías de tus productos.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadCategories()}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : ''}`} />
            </button>
            
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", description: "" });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-md shadow-purple-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-[#222] animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-[#222] rounded-lg mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#222] rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#222] rounded w-1/2"></div>
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No hay categorías creadas</p>
              <p className="text-gray-400 dark:text-gray-500 mt-1">Crea tu primera categoría para organizar tus productos</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-[#222] shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        {new Date(category.created_at).toLocaleDateString('es-ES', { 
                          day: 'numeric', month: 'short', year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setFormData({ name: category.name, description: category.description || "" });
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <SquarePenIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{category.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-[#222] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Harinas, Aceites, Dulces..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descripción de qué productos pertenecen a esta categoría..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
