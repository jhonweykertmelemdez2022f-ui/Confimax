"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Download } from "lucide-react";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";
import { ITEMS_PER_PAGE } from "@/types/inventory";
import { useInventoryData } from "@/hooks/useInventoryData";
import { NotificationMessages } from "@/components/inventory/NotificationMessages";
import { PageHeader } from "@/components/inventory/PageHeader";
import { Filters } from "@/components/inventory/Filters";
import { ProductTable } from "@/components/inventory/ProductTable";
import { ProductModal } from "@/components/inventory/ProductModal";

export default function InventoryPage() {
  const { user } = useAuth();
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
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "", sku: "", price: "", stock: "", category_id: "", description: "", image: "", expiration_date: ""
  });

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(".product-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, products]);

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
  }, [search, filterCategory, allProducts, setProducts]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    setEditingProduct(product);
    setFormData({
      name: product.name, sku: product.sku, price: String(product.price),
      stock: String(product.stock), category_id: product.category_id, description: product.description,
      image: "", expiration_date: ""
    });
    setShowModal(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({ 
      name: "", sku: "", price: "", stock: "", 
      category_id: categories[0]?.id || "", description: "", image: "", expiration_date: "" 
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", sku: "", price: "", stock: "", category_id: "", description: "", image: "", expiration_date: "" });
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  return (
    <>
      <NotificationMessages errorMsg={errorMsg} successMsg={successMsg} />

      <div className="space-y-6">
        <PageHeader 
          onRefresh={loadAllData} 
          loading={loading} 
          onNewProduct={handleNewProduct} 
        />
        
        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden">
          <Filters 
            search={search}
            onSearchChange={setSearch}
            filterCategory={filterCategory}
            onCategoryChange={setFilterCategory}
            categories={categories}
          />
          
          <ProductTable 
            products={currentItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tableRef={tableRef}
          />
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        <ProductModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editingProduct={editingProduct}
          categories={categories}
          formData={formData}
          onFormChange={setFormData}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </>
  );
}