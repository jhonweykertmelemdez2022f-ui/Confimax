"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Plus, Search, RefreshCw, AlertTriangle, CheckCircle, Package, Tag } from "lucide-react";
import Link from "next/link";
import { SquarePenIcon, DeleteIcon } from "@/components/AnimatedIcons";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  category?: string;
  description: string;
  image?: string;
  expiration_date?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const ITEMS_PER_PAGE = 9;

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "", sku: "", price: "", stock: "", category_id: "", description: "", image: "", expiration_date: ""
  });

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts().catch(() => ({ data: [] })),
        api.getCategories().catch(() => ({ data: [] })),
      ]);
      
      const prodData = Array.isArray((prodRes as any).data || prodRes) ? ((prodRes as any).data || prodRes) : [];
      const catData = Array.isArray((catRes as any).data || catRes) ? ((catRes as any).data || catRes) : [];
      
      const mappedProducts = prodData.map((p: any) => ({
        id: p.id || p.product_id,
        sku: p.sku,
        name: p.name,
        price: parseFloat(p.price || 0),
        stock: parseInt(p.stock || p.stock_quantity || 0),
        category_id: p.category_id,
        category: catData.find((c: any) => c.id === p.category_id)?.name || p.category || "Desconocida",
        description: p.description || "",
        image: p.image_url || p.image,
        expiration_date: p.expiration_date
      }));
      
      setAllProducts(mappedProducts);
      setProducts(mappedProducts);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(".product-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, products]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.price) * 0.7,
        is_active: true,
        stock_quantity: parseInt(formData.stock),
        category_id: formData.category_id,
        image_url: formData.image,
        expiration_date: formData.expiration_date || null
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccessMsg("Producto actualizado con éxito");
      } else {
        await api.createProduct(payload);
        setSuccessMsg("Producto creado con éxito");
      }
      
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: "", sku: "", price: "", stock: "", category_id: "", description: "", image: "", expiration_date: "" });
      await loadAllData();
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar el producto");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      setLoading(true);
      await api.deleteProduct(id);
      setSuccessMsg("Producto eliminado con éxito");
      await loadAllData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = allProducts.filter(p => {
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !filterCategory || p.category_id === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
    setProducts(filtered);
    setCurrentPage(1);
  }, [search, filterCategory, allProducts]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Mensajes de Error y Éxito - Por encima del modal */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center gap-3 text-blue-600 dark:text-blue-400 shadow-xl">
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Inventario</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los productos, precios y stock.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadAllData()}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            
            <Link
              href="/dashboard/categories"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] rounded-xl font-medium transition-all"
            >
              <Tag className="w-5 h-5" />
              <span>Gestionar Categorías</span>
            </Link>
            
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: "", sku: "", price: "", stock: "", category_id: categories[0]?.id || "", description: "", image: "", expiration_date: "" });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-[#222] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                currentItems.map((product) => (
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
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name, sku: product.sku, price: String(product.price),
                              stock: String(product.stock), category_id: product.category_id, description: product.description,
                              image: "", expiration_date: ""
                            });
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <SquarePenIcon />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
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
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 dark:border-[#222] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Editar Producto' : 'Crear Producto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                  <select 
                    required 
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
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
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-[#222]">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
