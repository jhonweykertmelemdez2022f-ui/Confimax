import { Tag } from "lucide-react";
import { SquarePenIcon, DeleteIcon } from "@/components/AnimatedIcons";
import { Category } from "@/types/categories";

interface CategoryGridProps {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryGrid({ categories, loading, onEdit, onDelete }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-[#222] animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-[#222] rounded-lg mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-[#222] rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-[#222] rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="col-span-full py-16 text-center">
        <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No hay categorías creadas</p>
        <p className="text-gray-400 dark:text-gray-500 mt-1">Crea tu primera categoría para organizar tus productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <div key={category.id} className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-[#222] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  {category.created_at ? new Date(category.created_at).toLocaleDateString('es-ES', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                  }) : 'Fecha no disponible'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(category)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <SquarePenIcon />
              </button>
              <button
                onClick={() => onDelete(category.id)}
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
      ))}
    </div>
  );
}