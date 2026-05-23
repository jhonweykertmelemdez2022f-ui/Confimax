import { Package } from "lucide-react";
import { Product } from "@/types/inventory";
import { SquarePenIcon, DeleteIcon } from "@/components/AnimatedIcons";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  tableRef: React.RefObject<HTMLDivElement>;
}

export function ProductTable({ products, onEdit, onDelete, tableRef }: ProductTableProps) {
  return (
    <div className="overflow-x-auto" ref={tableRef}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-[#222]">
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                No se encontraron productos.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="product-row hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                    {product.category}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#222] px-2 py-1 rounded-md">
                    {product.sku}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.stock > 10 ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' :
                    product.stock > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400'
                  }`}>
                    {product.stock} unds.
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <SquarePenIcon />
                    </button>
                    <button 
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}