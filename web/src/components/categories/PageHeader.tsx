import { RefreshCw, Plus, Tag } from "lucide-react";

interface PageHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  onNewCategory: () => void;
}

export function PageHeader({ onRefresh, loading, onNewCategory }: PageHeaderProps) {
  return (
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
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : ''}`} />
        </button>
        
        <button
          onClick={onNewCategory}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-md shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>
    </div>
  );
}