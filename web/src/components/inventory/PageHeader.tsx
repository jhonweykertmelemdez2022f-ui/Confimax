import { RefreshCw, Tag, Plus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PdfButton } from "../PdfButton";

interface PageHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  onNewProduct: () => void;
}

export function PageHeader({ onRefresh, loading, onNewProduct }: PageHeaderProps) {
  const handleDownloadPDF = () => {
    try {
      api.downloadProductsPDF();
    } catch (error) {
      console.error("Error al descargar PDF:", error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Inventario</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los productos, precios y stock.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
        </button>
        
        <PdfButton 
          onClick={handleDownloadPDF}
          className="rounded-xl border-gray-200 dark:border-[#333] shadow-none active:translate-y-0 active:translate-x-0"
          title="Descargar lista de productos en PDF"
        />
        
        <Link
          href="/dashboard/categories"
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] rounded-xl font-medium transition-all"
        >
          <Tag className="w-5 h-5" />
          <span>Gestionar Categorías</span>
        </Link>
        
        <button
          onClick={onNewProduct}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>
  );
}