import { X } from "lucide-react";
import { Product, Category } from "@/types/inventory";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  formData: any;
  onFormChange: (data: any) => void;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
}

export function ProductModal({ 
  isOpen, 
  onClose, 
  editingProduct, 
  categories, 
  formData, 
  onFormChange, 
  onSave, 
  loading 
}: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 dark:border-[#222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingProduct ? 'Editar Producto' : 'Crear Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            &times;
          </button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={e => onFormChange({...formData, name: e.target.value})} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
              <input 
                required 
                type="text" 
                value={formData.sku} 
                onChange={e => onFormChange({...formData, sku: e.target.value})} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select 
                required 
                value={formData.category_id}
                onChange={e => onFormChange({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio ($)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                value={formData.price} 
                onChange={e => onFormChange({...formData, price: e.target.value})} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
              <input 
                required 
                type="number" 
                value={formData.stock} 
                onChange={e => onFormChange({...formData, stock: e.target.value})} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea 
              rows={3} 
              value={formData.description} 
              onChange={e => onFormChange({...formData, description: e.target.value})} 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
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
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}