import { Category } from "@/types/categories";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  formData: { name: string; description: string };
  onFormChange: (data: { name: string; description: string }) => void;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
}

export function CategoryModal({ 
  isOpen, 
  onClose, 
  editingCategory, 
  formData, 
  onFormChange, 
  onSave, 
  loading 
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-[#222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            &times;
          </button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Categoría
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => onFormChange({...formData, name: e.target.value})}
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
              onChange={e => onFormChange({...formData, description: e.target.value})}
              placeholder="Breve descripción de qué productos pertenecen a esta categoría..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            ></textarea>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-[#222]">
            <button
              type="button"
              onClick={onClose}
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
  );
}