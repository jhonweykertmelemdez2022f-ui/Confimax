"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { NotificationMessages } from "@/components/ui/NotificationMessages";
import { PageHeader } from "@/components/categories/PageHeader";
import { CategoryGrid } from "@/components/categories/CategoryGrid";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { Category } from "@/types/categories";

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
        showSuccess("Categoría actualizada con éxito");
      } else {
        await api.createCategory(formData);
        showSuccess("Categoría creada con éxito");
      }
      
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      await loadCategories();
    } catch (err: any) {
      showError(err.message || "Error al guardar la categoría");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      await api.deleteCategory(id);
      showSuccess("Categoría eliminada con éxito");
      await loadCategories();
    } catch (err: any) {
      showError(err.message || "Error al eliminar");
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
    <>
      <NotificationMessages errorMsg={errorMsg} successMsg={successMsg} />

      <div className="space-y-6">
        <PageHeader 
          onRefresh={loadCategories} 
          loading={loading} 
          onNewCategory={handleNewCategory} 
        />
        
        <CategoryGrid 
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <CategoryModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingCategory={editingCategory}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
        loading={loading}
      />
    </>
  );
}