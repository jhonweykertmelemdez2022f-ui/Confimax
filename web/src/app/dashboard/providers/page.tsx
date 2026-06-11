"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { generateCombinedPdfAll } from "@/lib/pdfGenerator";
import { PdfButton } from "@/components/PdfButton";

const currencySymbol = (currency: string) => currency === 'VES' ? 'Bs.' : currency === 'COP' ? 'COP' : '$';

export default function ProvidersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerForm, setProviderForm] = useState({
    company_name: '',
    description: '',
    sells: '',
    contact_name: '',
    contact_id: '',
    phone: '',
    rif: '',
  });
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '' });
  const [purchaseForm, setPurchaseForm] = useState({ total: '', tax: '', due_date: '', items: '' });
  const [providerProducts, setProviderProducts] = useState<any[]>([]);
  const [providerPurchases, setProviderPurchases] = useState<any[]>([]);
  const [expiringInvoices, setExpiringInvoices] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    load();
    loadExpiringInvoices();
  }, []);

  useEffect(() => {
    // Bloquear acceso si el usuario no es admin ni Fabiana
    if (user && user.role !== 'admin' && user?.name?.toLowerCase() !== 'fabiana') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers();
      const data = res?.data || res || [];
      setProviders(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      console.error(e);
      setErrorMsg('No se pudieron cargar los proveedores.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    setLoading(true);
    try {
      if (!q || q.trim() === '') {
        await load();
        return;
      }
      const res = await api.searchSuppliers(q.trim());
      const data = res?.data || res || [];
      setProviders(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDetails = async (providerId: string) => {
    try {
      setLoading(true);
      const [providerRes, productsRes, purchasesRes] = await Promise.all([
        api.getSupplier(providerId),
        api.getSupplierProducts(providerId),
        api.getPurchases({ supplier_id: providerId }),
      ]);

      const provider = providerRes?.data || providerRes;
      setSelectedProvider(provider);
      setProviderForm({
        company_name: provider.company_name || '',
        description: provider.description || '',
        sells: provider.sells || '',
        contact_name: provider.contact_name || '',
        contact_id: provider.contact_id || '',
        phone: provider.phone || '',
        rif: provider.rif || '',
      });
      setProviderProducts(productsRes?.data || productsRes || []);
      setProviderPurchases(purchasesRes?.data || purchasesRes || []);
      setIsEditing(true);
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudieron cargar los detalles del proveedor.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringInvoices = async () => {
    try {
      const res = await api.getExpiringInvoices(7);
      setExpiringInvoices(res?.data || res || []);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setSelectedProvider(null);
    setProviderForm({ company_name: '', description: '', sells: '', contact_name: '', contact_id: '', phone: '', rif: '' });
    setProductForm({ name: '', sku: '', price: '' });
    setPurchaseForm({ total: '', tax: '', due_date: '', items: '' });
    setProviderProducts([]);
    setProviderPurchases([]);
    setIsEditing(false);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.company_name.trim()) {
      setErrorMsg('El nombre de la empresa es obligatorio.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    try {
      if (selectedProvider) {
        await api.updateSupplier(selectedProvider.id, providerForm);
        setSuccessMsg('Proveedor actualizado.');
      } else {
        await api.createSupplier(providerForm);
        setSuccessMsg('Proveedor creado.');
      }
      await load();
      setTimeout(() => setSuccessMsg(''), 4000);
      if (selectedProvider) await loadProviderDetails(selectedProvider.id);
      else resetForm();
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'No se pudo guardar el proveedor.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('¿Eliminar este proveedor? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteSupplier(providerId);
      setSuccessMsg('Proveedor eliminado.');
      await load();
      resetForm();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'No se pudo eliminar el proveedor.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProvider) return;
    if (!productForm.name.trim() || !productForm.price.trim()) {
      setErrorMsg('Nombre y precio del producto son obligatorios.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    try {
      await api.addSupplierProduct(selectedProvider.id, {
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price) || 0,
      });
      setProductForm({ name: '', sku: '', price: '' });
      await loadProviderDetails(selectedProvider.id);
      setSuccessMsg('Producto agregado al proveedor.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'Error al agregar producto.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleRecordPurchase = async () => {
    if (!selectedProvider) return;
    if (!purchaseForm.total.trim() || !purchaseForm.due_date.trim()) {
      setErrorMsg('Total y fecha de vencimiento son obligatorios.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    try {
      const items = purchaseForm.items
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((description) => ({ description }));

      await api.recordPurchase(selectedProvider.id, {
        total: parseFloat(purchaseForm.total) || 0,
        tax: parseFloat(purchaseForm.tax) || 0,
        due_date: purchaseForm.due_date,
        items,
      });
      setPurchaseForm({ total: '', tax: '', due_date: '', items: '' });
      await loadProviderDetails(selectedProvider.id);
      await loadExpiringInvoices();
      setSuccessMsg('Compra registrada con IVA.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'Error al registrar la compra.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleSelectProvider = async (provider: any) => {
    setSelectedProvider(provider);
    await loadProviderDetails(provider.id);
  };

  const handleDownloadPDF = async () => {
    try {
      await generateCombinedPdfAll(api);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {(errorMsg || successMsg) && (
        <div className={`p-4 border-2 ${errorMsg ? 'border-error bg-[#fee2e2] text-error' : 'border-green-500 bg-[#dcfce7] text-green-800'}`}>
          {errorMsg || successMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Proveedores</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Administra proveedores, productos y compras con IVA.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetForm} className="min-h-[44px] px-4 py-2 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright text-slate-900 dark:text-white font-data-label text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">Nuevo</button>
              <PdfButton onClick={handleDownloadPDF} title="Reporte completo" />
            </div>
          </div>

          {expiringInvoices.length > 0 && (
            <div className="p-4 border border-orange-400 bg-orange-50 rounded-lg">
              <p className="font-semibold">Facturas por vencer</p>
              {expiringInvoices.slice(0, 4).map((invoice: any) => (
                <p key={invoice.id} className="text-sm text-slate-700">{invoice.provider_name || invoice.provider_id}: vence {new Date(invoice.due_date).toLocaleDateString()}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-900 dark:border-white rounded-lg bg-white dark:bg-surface-bright">
              <h2 className="font-semibold mb-3">Crear / editar proveedor</h2>
              <div className="space-y-3">
                <input value={providerForm.company_name} onChange={(e) => setProviderForm({ ...providerForm, company_name: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Razón social" />
                <textarea value={providerForm.description} onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Descripción" rows={3} />
                <input value={providerForm.sells} onChange={(e) => setProviderForm({ ...providerForm, sells: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Qué vende" />
                <input value={providerForm.contact_name} onChange={(e) => setProviderForm({ ...providerForm, contact_name: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Nombre del vendedor" />
                <input value={providerForm.contact_id} onChange={(e) => setProviderForm({ ...providerForm, contact_id: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Cédula del vendedor" />
                <input value={providerForm.phone} onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Teléfono" />
                <input value={providerForm.rif} onChange={(e) => setProviderForm({ ...providerForm, rif: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="RIF" />
                <button onClick={handleSaveProvider} className="min-h-[44px] px-4 py-2 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright text-slate-900 dark:text-white font-data-label text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors w-full">{selectedProvider ? 'Actualizar proveedor' : 'Crear proveedor'}</button>
                {selectedProvider && (
                  <button onClick={() => handleDeleteProvider(selectedProvider.id)} className="min-h-[44px] px-4 py-2 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright text-slate-900 dark:text-white font-data-label text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors w-full">Eliminar proveedor</button>
                )}
              </div>
            </div>

            <div className="p-4 border border-slate-900 dark:border-white rounded-lg bg-white dark:bg-surface-bright">
              <h2 className="font-semibold mb-3">Listado de proveedores</h2>
              <div className="mb-3">
                <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Buscar proveedores..." className="w-full px-3 py-2 border rounded" />
              </div>
              {loading ? <div>Cargando...</div> : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto">
                  {providers.map((providerItem) => (
                    <button key={providerItem.id} onClick={() => handleSelectProvider(providerItem)} className="w-full text-left p-3 border border-slate-900 dark:border-white rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dim transition-colors">
                      <div className="font-bold">{providerItem.company_name}</div>
                      <div className="text-xs text-slate-500">{providerItem.contact_name || 'Sin contacto'} · {providerItem.phone || 'Sin teléfono'}</div>
                      <div className="text-xs text-slate-500">{providerItem.rif || 'Sin RIF'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[38%] space-y-4">
          {selectedProvider ? (
            <div className="p-4 border border-slate-900 dark:border-white rounded-lg bg-white dark:bg-surface-bright">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{selectedProvider.company_name}</h2>
                  <p className="text-sm text-slate-500">{selectedProvider.description || 'Sin descripción'}</p>
                </div>
                <span className="text-xs uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Proveedor</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">Contacto</p>
                  <p>{selectedProvider.contact_name || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Cédula</p>
                  <p>{selectedProvider.contact_id || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Teléfono</p>
                  <p>{selectedProvider.phone || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">RIF</p>
                  <p>{selectedProvider.rif || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Qué vende</p>
                  <p>{selectedProvider.sells || 'No especificado'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Productos del proveedor</h3>
                <div className="space-y-3 mb-4">
                  {providerProducts.length === 0 ? (
                    <div className="text-sm text-slate-500">No hay productos registrados.</div>
                  ) : providerProducts.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-slate-500">SKU: {product.sku || 'N/A'}</div>
                      <div className="text-sm">{currencySymbol(product.price ? String(product.price) : '0')} {product.price?.toFixed ? product.price.toFixed(2) : product.price}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Nombre producto" />
                  <input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="SKU" />
                  <input value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue" placeholder="Precio" type="number" />
                  <button onClick={handleAddProduct} className="min-h-[44px] px-4 py-2 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright text-slate-900 dark:text-white font-data-label text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors w-full">Agregar producto</button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Registrar compra</h3>
                <input value={purchaseForm.total} onChange={(e) => setPurchaseForm({ ...purchaseForm, total: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue mb-3" placeholder="Total" type="number" />
                <input value={purchaseForm.tax} onChange={(e) => setPurchaseForm({ ...purchaseForm, tax: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue mb-3" placeholder="IVA" type="number" />
                <input value={purchaseForm.due_date} onChange={(e) => setPurchaseForm({ ...purchaseForm, due_date: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue mb-3" placeholder="Vence (YYYY-MM-DD)" />
                <textarea value={purchaseForm.items} onChange={(e) => setPurchaseForm({ ...purchaseForm, items: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-sm outline-none focus:ring-1 focus:ring-data-blue mb-3" placeholder="Items separados por coma" rows={3} />
                <button onClick={handleRecordPurchase} className="min-h-[44px] px-4 py-2 border border-slate-900 dark:border-white bg-white dark:bg-surface-bright text-slate-900 dark:text-white font-data-label text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors w-full">Registrar compra</button>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Compras del proveedor</h3>
                {providerPurchases.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay compras registradas.</div>
                ) : providerPurchases.map((purchase) => (
                  <div key={purchase.id} className="p-3 border rounded-lg mb-3">
                    <div className="font-semibold">Total: {currencySymbol(String(purchase.total))} {purchase.total?.toFixed ? purchase.total.toFixed(2) : purchase.total}</div>
                    <div className="text-xs text-slate-500">IVA: {purchase.tax?.toFixed ? purchase.tax.toFixed(2) : purchase.tax}</div>
                    <div className="text-xs text-slate-500">Vence: {purchase.due_date || 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 border rounded-lg bg-white text-slate-600">Selecciona un proveedor para ver detalles, productos y compras.</div>
          )}
        </div>
      </div>
    </div>
  );
}
