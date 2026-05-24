"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { Category } from "@/types/categories";
import { gsap } from "gsap";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { 
    categories, 
    loading, 
    errorMsg, 
    successMsg, 
    loadCategories, 
    showSuccess, 
    showError 
  } = useCategoriesData();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        showSuccess("CATEGORÍA ACTUALIZADA CON ÉXITO");
      } else {
        await api.createCategory(formData);
        showSuccess("CATEGORÍA CREADA CON ÉXITO");
      }
      
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      await loadCategories();
    } catch (err: any) {
      showError(err.message || "ERROR AL GUARDAR CATEGORÍA");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRMACIÓN DE BORRADO: ¿Proceder?")) return;
    try {
      await api.deleteCategory(id);
      showSuccess("CATEGORÍA ELIMINADA");
      await loadCategories();
    } catch (err: any) {
      showError(err.message || "ERROR AL ELIMINAR");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setShowModal(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Notificaciones */}
      {(errorMsg || successMsg) && (
        <div className={`fixed top-24 right-8 z-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${errorMsg ? 'bg-error text-white' : 'bg-[#00FF66] text-slate-900'} animate-bounce`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">
              {errorMsg ? 'warning' : 'check_circle'}
            </span>
            <span className="font-data-label text-xs uppercase tracking-widest font-bold">
              {errorMsg || successMsg}
            </span>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6">
        <div>
          <h1 className="font-headline-lg text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px]">category</span>
            GESTIÓN DE CATEGORÍAS
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            CONTROL DE CLASIFICACIÓN DE INVENTARIO
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => loadCategories()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
          <button 
            onClick={handleNewCategory}
            className="btn-precision inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white min-h-[44px]"
          >
            <span className="material-symbols-outlined">add</span>
            NUEVA CATEGORÍA
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface border-dashed">
          <span className="material-symbols-outlined text-[48px] text-data-blue animate-spin mb-4">autorenew</span>
          <span className="font-data-label text-xs uppercase tracking-widest">Sincronizando...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-4">category</span>
          <span className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white mb-2">SIN REGISTROS</span>
          <span className="font-data-label text-xs uppercase tracking-widest text-slate-500">Crea la primera categoría</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="relative p-6 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface flex flex-col group transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1">
              <span className="absolute top-4 right-4 font-data-label text-[10px] tracking-widest border border-slate-900/20 dark:border-white/20 px-2 py-0.5 text-slate-500 uppercase">
                ID: {cat.id.substring(0, 8)}
              </span>
              <div className="w-12 h-12 border border-slate-900 dark:border-white flex items-center justify-center mb-4 bg-slate-50 dark:bg-surface-dim">
                <span className="material-symbols-outlined text-slate-900 dark:text-white">folder</span>
              </div>
              <h3 className="font-headline-lg-mobile text-xl uppercase tracking-tighter text-slate-900 dark:text-white mb-2">
                {cat.name}
              </h3>
              <p className="font-body-md text-sm text-slate-600 dark:text-slate-400 mb-6 flex-grow">
                {cat.description || "Sin descripción"}
              </p>
              
              <div className="flex gap-2 border-t border-slate-900/10 dark:border-white/10 pt-4 mt-auto">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 border border-slate-900 dark:border-white bg-transparent hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors font-data-label text-[10px] font-bold uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  EDITAR
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-error bg-error/10 text-error hover:bg-error hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Brutalista */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">
                {editingCategory ? "MODIFICAR CATEGORÍA" : "CREAR CATEGORÍA"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">NOMBRE DE CATEGORÍA</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md"
                    placeholder="Ej. Frescos"
                  />
                </div>
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">DESCRIPCIÓN (OPCIONAL)</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md resize-none"
                    placeholder="Descripción de los artículos"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 min-h-[44px] font-data-label text-xs font-bold uppercase tracking-widest border-2 border-slate-900 dark:border-white hover:bg-slate-100 dark:hover:bg-surface-dim transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 min-h-[44px] font-data-label text-xs font-bold uppercase tracking-widest border-2 border-slate-900 dark:border-white bg-data-blue text-white hover:bg-slate-900 disabled:opacity-50 transition-colors"
                >
                  {loading ? "PROCESANDO..." : "GUARDAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}