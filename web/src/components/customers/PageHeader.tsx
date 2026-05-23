import { RefreshCw, Plus, Search, Users } from "lucide-react";

interface PageHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  onNewCustomer: () => void;
}

export function PageHeader({ onRefresh, loading, onNewCustomer }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Directorio de Clientes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tu cartera de clientes y contactos.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : ''}`} />
        </button>
        
        <button
          onClick={onNewCustomer}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all shadow-md shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>
    </div>
  );
}