"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";
import { ITEMS_PER_PAGE } from "@/types/inventory";
import { useInventoryData } from "@/hooks/useInventoryData";
import { PdfButton } from "@/components/PdfButton";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock?: number;
  stock_quantity?: number;
  category_id: string;
  category_name?: string;
  description?: string;
  images?: Array<{ id: string; image_url: string; is_primary: boolean; display_order: number }>;
}

export default function InventoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { 
    products, 
    setProducts, 
    allProducts, 
    categories, 
    loading, 
    errorMsg, 
    successMsg, 
    loadAllData, 
    showSuccess, 
    showError 
  } = useInventoryData();
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "", sku: "", price: "", stock: "", category_id: "", description: "", expiration_date: "", images: [] as string[]
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && user && user.role !== "admin" && user.role !== "vendedor") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!loading && tableRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.fromTo(".product-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading]);

  useEffect(() => {
    const filtered = allProducts.filter(p => {
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || p.category_id === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
    setProducts(filtered);
    setCurrentPage(1);
  }, [search, filterCategory, allProducts, setProducts]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.price) * 0.7,
        is_active: true,
        stock_quantity: parseInt(formData.stock),
        category_id: formData.category_id,
        expiration_date: formData.expiration_date || null,
        images: formData.images
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showSuccess("Producto actualizado con éxito");
      } else {
        await api.createProduct(payload);
        showSuccess("Producto creado con éxito");
      }
      
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      await loadAllData();
    } catch (err: any) {
      showError(err.message || "Error al guardar el producto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await api.deleteProduct(id);
      showSuccess("Producto eliminado con éxito");
      await loadAllData();
    } catch (err: any) {
      showError(err.message || "Error al eliminar");
    }
  };

  const handleEdit = (product: any) => {
    const existingImages: string[] = product.images?.map((img: any) => img.image_url) || [];
    if (product.image_url && !existingImages.includes(product.image_url)) {
      existingImages.unshift(product.image_url);
    }
    if (existingImages.length === 0 && product.image_url) {
      existingImages.push(product.image_url);
    }
    setEditingProduct(product);
    setFormData({
      name: product.name, 
      sku: product.sku, 
      price: String(product.price),
      stock: String(product.stock_quantity || product.stock), 
      category_id: product.category_id, 
      description: product.description || "",
      expiration_date: product.expiration_date || "",
      images: existingImages
    });
    setShowModal(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({ 
      name: "", sku: "", price: "", stock: "", 
      category_id: categories[0]?.id || "", description: "", expiration_date: "", images: [] 
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", sku: "", price: "", stock: "", category_id: "", description: "", expiration_date: "", images: [] });
  };

  const handleDownloadPDF = () => {
    const columns = [
      { header: 'Producto', dataKey: 'name' },
      { header: 'SKU', dataKey: 'sku' },
      { header: 'Categoría', dataKey: 'category_name' },
      { header: 'Precio', dataKey: 'price_formatted' },
      { header: 'Stock', dataKey: 'stock_quantity' },
    ];

    const data = allProducts.map(p => ({
      ...p,
      price_formatted: `$${formatPrice(p.price)}`,
      stock_quantity: p.stock_quantity || p.stock || 0
    }));

    generateReportPDF('Reporte General de Productos', columns, data, 'reporte_productos.pdf');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  const formatPrice = (price: any) => {
    const num = parseFloat(String(price || 0));
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getStockColor = (stock?: number) => {
    const s = stock || 0;
    if (s <= 5) return 'text-error';
    if (s <= 20) return 'text-yellow-500';
    return 'text-[#00FF66]';
  };

  const getPrimaryImage = (product: Product & { image_url?: string }) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.is_primary);
      if (primary) return primary.image_url;
      return product.images[0].image_url;
    }
    return product.image_url || null;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-xl text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            INVENTARIO
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            GESTIONA TUS PRODUCTOS, PRECIOS Y STOCK.
          </p>
        </div>
        
        <div className="flex gap-4">
          <PdfButton onClick={handleDownloadPDF} />
          <button 
            onClick={() => loadAllData()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
          <button 
            onClick={() => handleNewProduct()}
            className="btn-precision inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white min-h-[44px]"
          >
            <span className="material-symbols-outlined">add</span>
            NUEVO PRODUCTO
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 border-2 border-error bg-error/10 flex items-center gap-3 text-error">
          <span className="material-symbols-outlined">warning</span>
          <span className="font-data-label font-bold text-sm uppercase">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 border-2 border-[#00FF66] bg-[#00FF66]/10 flex items-center gap-3 text-[#00FF66]">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-data-label font-bold text-sm uppercase">{successMsg}</span>
        </div>
      )}

      <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface relative">
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />

        <div className="p-4 border-b-2 border-slate-900 dark:border-white flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-surface-dim">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="BUSCAR POR NOMBRE O SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label uppercase tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-data-blue"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="min-h-[44px] px-4 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-xs uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-data-blue"
          >
            <option value="all">TODAS LAS CATEGORÍAS</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto min-h-[500px]" ref={tableRef}>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-surface-dim border-b-2 border-slate-900 dark:border-white">
              <tr>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">PRODUCTO</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">CATEGORÍA</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">SKU</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">STOCK</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10 text-right">PRECIO</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 text-center">CMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                     <span className="material-symbols-outlined text-[48px] text-slate-300 mb-4">search_off</span>
                     <p className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white">SIN RESULTADOS</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((product: Product) => {
                  const category = categories.find(c => c.id === product.category_id);
                  const stock = Number(product.stock || product.stock_quantity || 0);
                  const primaryImage = getPrimaryImage(product);
                  return (
                    <tr key={product.id} className="product-row hover:bg-slate-50 dark:hover:bg-surface-dim transition-colors group">
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          {primaryImage && (
                            <img 
                              src={primaryImage} 
                              alt={product.name}
                              className="w-12 h-12 object-cover border border-slate-900 dark:border-white"
                            />
                          )}
                          <p className="font-headline-lg-mobile text-sm uppercase text-slate-900 dark:text-white">{product.name}</p>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <span className="font-data-label text-[10px] font-bold tracking-widest uppercase px-2 py-1 border bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-300 dark:border-purple-500/30">
                          {category?.name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <p className="font-data-label text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                          {product.sku}
                        </p>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <span className={`font-data-label text-[10px] font-bold tracking-widest uppercase px-2 py-1 border ${getStockColor(stock)}`}>
                          {stock} unidades
                        </span>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10 text-right">
                        <p className="font-display-xl text-xl font-black text-slate-900 dark:text-white">
                          ${formatPrice(product.price)}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-error text-error bg-error/10 hover:bg-error hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between shrink-0 sticky top-0 z-10">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">
                {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">NOMBRE DEL PRODUCTO</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">SKU</label>
                  <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">CATEGORÍA</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">PRECIO</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">STOCK</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">DESCRIPCIÓN</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 min-h-[100px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
                <div className="col-span-2">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">IMÁGENES DEL PRODUCTO</label>
                  <div className="mb-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({
                              ...prev,
                              images: [...prev.images, event.target?.result as string]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue"
                    />
                  </div>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {formData.images.map((imgUrl, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={imgUrl} 
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover border border-slate-900 dark:border-white"
                          />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-data-label text-[10px] tracking-widest uppercase font-bold block mb-1">FECHA DE VENCIMIENTO (OPCIONAL)</label>
                  <input type="date" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t-2 border-slate-900 dark:border-white mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="min-h-[44px] px-5 py-2.5 border border-slate-900 dark:border-white font-data-label text-xs tracking-widest uppercase font-bold text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
                  CANCELAR
                </button>
                <button type="submit" disabled={loading} className="min-h-[44px] px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white font-data-label text-xs tracking-widest uppercase font-bold transition-colors disabled:opacity-50">
                  {loading ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
