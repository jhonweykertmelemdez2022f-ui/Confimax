import { Search } from "lucide-react";
import { Category } from "@/types/inventory";

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  categories: Category[];
}

export function Filters({ search, onSearchChange, filterCategory, onCategoryChange, categories }: FiltersProps) {
  return (
    <div className="p-4 border-b border-gray-100 dark:border-[#222] flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o SKU..." 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white"
        />
      </div>
      
      <div className="w-full sm:w-48">
        <select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}