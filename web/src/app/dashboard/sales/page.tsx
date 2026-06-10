"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";
import { generateReportPDF } from "@/lib/pdfGenerator";
import { PdfButton } from "@/components/PdfButton";

interface SaleItem {
  id?: string;
  product_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total?: number;
}

interface Sale {
  id: string;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  user_id?: string;
  user_name?: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

const ITEMS_PER_PAGE = 9;

const formatCurrency = (price: any, currency: string = 'USD') => {
  const num = parseFloat(String(price || 0));
  const symbol = currency === 'VES' ? 'Bs.' : currency === 'COP' ? 'COP' : '$';
  return `${symbol} ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
};

const formatPrice = (price: any) => {
  const num = parseFloat(String(price || 0));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const getSaleItemLabel = (item: any) => {
  return item.product_name || item.name || item.product?.name || item.product?.title || item.sku || item.product_id || 'Producto';
};

const getSaleItemQuantity = (item: any) => {
  return item.quantity ?? item.qty ?? item.quantity_sold ?? 0;
};

const getSaleItemUnitPrice = (item: any) => {
  return item.unit_price ?? item.price ?? 0;
};

const getSaleItemTotal = (item: any) => {
  return item.total ?? item.subtotal ?? getSaleItemQuantity(item) * getSaleItemUnitPrice(item);
};

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'PENDIENTE', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'entregado', label: 'ENTREGADO', color: 'bg-[#00FF66] text-slate-900 border-[#00FF66]' },
  { value: 'cancelado', label: 'CANCELADO', color: 'bg-error text-white border-error' }
];

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  
  const [newSaleItems, setNewSaleItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [saleNotes, setSaleNotes] = useState("");
  
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    person_type: "V" as 'V' | 'E' | 'J' | 'G',
    tax_id_number: ""
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const normalizeStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'pendiente',
      'delivered': 'entregado',
      'cancelled': 'cancelado',
      'canceled': 'cancelado',
      'confirmed': 'entregado',
      'processing': 'pendiente',
      'shipped': 'entregado',
      'refunded': 'cancelado'
    };
    return statusMap[status] || status;
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [salesRes, productsRes, customersRes] = await Promise.all([
        api.getSales().catch(() => ({ data: [] })),
        api.getProducts().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] }))
      ]);
      
      const salesData = Array.isArray((salesRes as any).data || salesRes) ? ((salesRes as any).data || salesRes) : [];
      const productsData = Array.isArray((productsRes as any).data || productsRes) ? ((productsRes as any).data || productsRes) : [];
      const customersData = Array.isArray((customersRes as any).data || customersRes) ? ((customersRes as any).data || customersRes) : [];
      
      const mappedProducts = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: parseFloat(String(p.price || 0))
      }));

      const mappedSales = salesData.map((sale: any) => ({
        ...sale,
        status: normalizeStatus(sale.status)
      }));
      
      setAllSales(mappedSales as Sale[]);
      setSales(mappedSales as Sale[]);
      setProducts(mappedProducts);
      setCustomers(customersData as Customer[]);
    } catch (err) {
      console.error(err);
      setErrorMsg("ERROR DE SINCRONIZACIÓN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && tableRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.fromTo(".sale-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading]);

  useEffect(() => {
    let filtered = [...allSales];
    
    if (search) {
      filtered = filtered.filter(s => 
        (s.id?.toLowerCase().includes(search.toLowerCase()) || 
         s.order_number?.toLowerCase().includes(search.toLowerCase()) ||
         s.customer_name?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    setSales(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, allSales]);

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  const addItemToSale = (product: Product) => {
    const existingItem = newSaleItems.find(item => item.product_id === product.id);
    const unitPrice = parseFloat(String(product.price || 0));
    
    if (existingItem) {
      setNewSaleItems(newSaleItems.map(item => 
        item.product_id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * unitPrice
            }
          : item
      ));
    } else {
      setNewSaleItems([
        ...newSaleItems,
        {
          product_id: product.id,
          sku: product.sku,
          product_name: product.name,
          quantity: 1,
          unit_price: unitPrice,
          total: unitPrice
        }
      ]);
    }
  };

  const removeItemFromSale = (index: number) => {
    setNewSaleItems(newSaleItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...newSaleItems];
    const qty = Math.max(1, quantity);
    const unitPrice = parseFloat(String(updated[index].unit_price || 0));
    updated[index].quantity = qty;
    updated[index].total = qty * unitPrice;
    setNewSaleItems(updated);
  };

  const calculateSaleTotal = () => {
    return newSaleItems.reduce((sum, item) => {
      const itemTotal = parseFloat(String(item.total || item.quantity * item.unit_price || 0));
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  const handleCreateSale = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      
      if (newSaleItems.length === 0) {
        setErrorMsg("SE REQUIERE AL MENOS UN PRODUCTO");
        return;
      }

      const saleData = {
        customer_id: selectedCustomer || undefined,
        items: newSaleItems,
        status: 'pendiente',
        notes: saleNotes
      };

      await api.createSale(saleData);
      setSuccessMsg("TRANSACCIÓN REGISTRADA");
      setIsModalOpen(false);
      resetForm();
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "ERROR EN LA TRANSACCIÓN");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.updateSaleStatus(id, newStatus);
      setSuccessMsg("ESTADO ACTUALIZADO");
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "ERROR DE ACTUALIZACIÓN");
    }
  };

  const resetForm = () => {
    setNewSaleItems([]);
    setSelectedCustomer("");
    setSaleNotes("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const handleCreateCustomer = async () => {
    try {
      if (!newCustomerForm.name || !newCustomerForm.email) {
        setErrorMsg("NOMBRE Y EMAIL SON REQUERIDOS");
        return;
      }

      if (newCustomerForm.tax_id_number && (newCustomerForm.tax_id_number.length < 8 || newCustomerForm.tax_id_number.length > 9)) {
        setErrorMsg("LA CÉDULA/RIF DEBE TENER ENTRE 8 Y 9 CARACTERES");
        return;
      }

      let tax_id = undefined;
      if (newCustomerForm.person_type && newCustomerForm.tax_id_number) {
        const digitoVerificador = newCustomerForm.tax_id_number.length === 9 
          ? newCustomerForm.tax_id_number.slice(-1) 
          : '0';
        const numeroSinDigito = newCustomerForm.tax_id_number.length === 9 
          ? newCustomerForm.tax_id_number.slice(0, -1) 
          : newCustomerForm.tax_id_number;
        
        tax_id = `${newCustomerForm.person_type}-${numeroSinDigito}-${digitoVerificador}`;
      }

      const payload = {
        name: newCustomerForm.name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
        address: newCustomerForm.address,
        tax_id: tax_id,
        rif: tax_id
      };

      const newCustomer = await api.createCustomer(payload) as any;
      const customerData = newCustomer.data || newCustomer;
      
      setCustomers([...customers, customerData]);
      setSelectedCustomer(customerData.id);
      setCustomerSearch(`${customerData.name} - ${customerData.email}`);
      
      setSuccessMsg("CLIENTE REGISTRADO");
      setShowNewCustomerForm(false);
      setShowCustomerDropdown(false);
      setNewCustomerForm({ 
        name: "", email: "", phone: "", address: "", 
        person_type: "V", tax_id_number: "" 
      });
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "ERROR EN REGISTRO DE CLIENTE");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer.id);
    setCustomerSearch(`${customer.name} - ${customer.email}`);
    setShowCustomerDropdown(false);
  };

  const openDetails = async (sale: Sale) => {
    try {
      const fullSale = await api.getSale(sale.id) as Sale;
      setSelectedSale({ ...fullSale, status: normalizeStatus(fullSale.status) });
      setIsDetailsModalOpen(true);
    } catch (err) {
      setSelectedSale({ ...sale, status: normalizeStatus(sale.status) });
      setIsDetailsModalOpen(true);
    }
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = sales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);

  const handleDownloadPDF = () => {
    const columns = [
      { header: 'Nº Orden', dataKey: 'order_number_label' },
      { header: 'Fecha', dataKey: 'created_at_label' },
      { header: 'Cliente', dataKey: 'customer_name' },
      { header: 'Estado', dataKey: 'status' },
      { header: 'Total', dataKey: 'total_label' },
    ];

    const data = allSales.map(s => ({
      ...s,
      order_number_label: s.order_number || s.id.substring(0, 8).toUpperCase(),
      created_at_label: new Date(s.created_at).toLocaleDateString(),
      total_label: formatCurrency(s.total, s.currency || 'USD')
    }));

    generateReportPDF('Reporte General de Ventas', columns, data, 'reporte_ventas.pdf');
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Notificaciones */}
      {(errorMsg || successMsg) && (
        <div className={`fixed top-24 right-8 z-50 p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${errorMsg ? 'bg-error text-white' : 'bg-[#00FF66] text-slate-900'} animate-bounce`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">
              {errorMsg ? 'warning' : 'check_circle'}
            </span>
            <span className="font-data-label text-xs uppercase tracking-widest font-bold">
              {errorMsg || successMsg}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6">
        <div>
          <h1 className="font-headline-lg text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
            CONTROL DE VENTAS
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            REGISTRO E HISTORIAL DE TRANSACCIONES
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
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn-precision inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white min-h-[44px]"
          >
            <span className="material-symbols-outlined">add</span>
            NUEVA TRANSACCIÓN
          </button>
        </div>
      </div>

      <div className="border-2 border-slate-900 dark:border-white bg-white dark:bg-surface relative">
        <div className="crosshair-tl" />
        <div className="crosshair-tr" />

        {/* Controles de filtro */}
        <div className="p-4 border-b-2 border-slate-900 dark:border-white flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-surface-dim">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="BUSCAR POR ID, NÚMERO U CLIENTE..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label uppercase tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-data-blue"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-4 bg-white dark:bg-surface-bright border border-slate-900 dark:border-white font-data-label text-xs uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-1 focus:ring-data-blue"
          >
            <option value="all">TODOS LOS ESTADOS</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto min-h-[500px]" ref={tableRef}>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-surface-dim border-b-2 border-slate-900 dark:border-white">
              <tr>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">ID ORDEN</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">CLIENTE</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">TIMESTAMP</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10">ESTADO</th>
                <th className="p-4 font-data-label text-xs tracking-widest uppercase text-slate-500 border-r border-slate-900/10 dark:border-white/10 text-right">TOTAL</th>
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
                currentItems.map((sale) => {
                  const statusInfo = getStatusInfo(sale.status);
                  return (
                    <tr key={sale.id} className="sale-row hover:bg-slate-50 dark:hover:bg-surface-dim transition-colors group">
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <p className="font-data-label font-bold text-sm tracking-widest text-slate-900 dark:text-white uppercase">
                          {sale.order_number || sale.id.substring(0, 8)}
                        </p>
                        <p className="font-data-label text-[10px] text-slate-500 mt-1 uppercase">
                          {sale.id.substring(0, 8)}
                        </p>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        {sale.customer_name ? (
                          <>
                            <p className="font-headline-lg-mobile text-sm uppercase text-slate-900 dark:text-white">{sale.customer_name}</p>
                            {sale.customer_email && (
                              <p className="font-data-label text-[10px] uppercase text-slate-500 tracking-widest mt-1">{sale.customer_email}</p>
                            )}
                          </>
                        ) : (
                          <span className="font-data-label text-xs uppercase text-slate-500 bg-slate-100 dark:bg-surface px-2 py-0.5">SIN CLIENTE</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <p className="font-data-label text-xs tracking-widest uppercase text-slate-900 dark:text-white">
                          {new Date(sale.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'})}
                        </p>
                        <p className="font-data-label text-[10px] tracking-widest uppercase text-slate-500 mt-1">
                          {new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className={`font-data-label text-[10px] font-bold tracking-widest uppercase px-2 py-1 border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {sale.status === 'pendiente' && (
                            <select
                              value={sale.status}
                              onChange={(e) => handleUpdateStatus(sale.id, e.target.value)}
                              className="font-data-label text-[10px] bg-white dark:bg-surface border border-slate-900 dark:border-white px-2 py-1 uppercase outline-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-900/10 dark:border-white/10 text-right">
                        <p className="font-display-xl text-xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(sale.total, sale.currency || 'USD')}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openDetails(sale)}
                          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
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

      {/* Modal Nueva Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between shrink-0">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">NUEVA TRANSACCIÓN</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 brutal-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Catálogo */}
                <div>
                  <h3 className="font-data-label text-xs tracking-widest uppercase font-bold text-slate-500 mb-4 border-b border-slate-900/20 dark:border-white/20 pb-2">PRODUCTOS DISPONIBLES</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 brutal-scrollbar">
                    {products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addItemToSale(product)}
                        className="w-full p-4 border border-slate-900 dark:border-white bg-white dark:bg-surface hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors flex items-center justify-between text-left group"
                      >
                        <div>
                          <p className="font-headline-lg-mobile text-sm uppercase">{product.name}</p>
                          <p className="font-data-label text-[10px] tracking-widest mt-1 text-slate-500 group-hover:text-slate-300">SKU: {product.sku}</p>
                        </div>
                        <div className="font-data-label font-bold text-lg">
                          ${formatPrice(product.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carrito */}
                <div className="flex flex-col h-full border-l lg:border-slate-900/20 lg:dark:border-white/20 lg:pl-8">
                  <h3 className="font-data-label text-xs tracking-widest uppercase font-bold text-slate-500 mb-4 border-b border-slate-900/20 dark:border-white/20 pb-2">CARRITO DE COMPRA</h3>
                  
                  {/* Selector Cliente */}
                  <div className="mb-6 relative" ref={customerDropdownRef}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-data-label text-[10px] tracking-widest uppercase font-bold">CLIENTE (OPCIONAL)</label>
                      {!showNewCustomerForm && (
                        <button onClick={() => { setShowNewCustomerForm(true); setShowCustomerDropdown(false); }} className="font-data-label text-[10px] tracking-widest uppercase text-data-blue hover:underline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person_add</span> NUEVO
                        </button>
                      )}
                    </div>

                    {showNewCustomerForm ? (
                      <div className="p-4 border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-headline-lg-mobile text-sm uppercase">REGISTRO RÁPIDO</span>
                          <button onClick={() => setShowNewCustomerForm(false)} className="text-slate-500 hover:text-error">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <input type="text" placeholder="NOMBRE COMPLETO" value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} className="w-full p-2 border border-slate-900 dark:border-white bg-white dark:bg-surface font-body-md text-sm outline-none" />
                        <input type="email" placeholder="CORREO ELECTRÓNICO" value={newCustomerForm.email} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} className="w-full p-2 border border-slate-900 dark:border-white bg-white dark:bg-surface font-body-md text-sm outline-none" />
                        <div className="flex gap-2">
                           <select value={newCustomerForm.person_type} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, person_type: e.target.value as 'V'|'E'|'J'|'G' })} className="p-2 border border-slate-900 dark:border-white bg-white dark:bg-surface font-data-label text-sm outline-none">
                             <option value="V">V</option><option value="E">E</option><option value="J">J</option><option value="G">G</option>
                           </select>
                           <input type="text" placeholder="CÉDULA/RIF" value={newCustomerForm.tax_id_number} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tax_id_number: e.target.value.replace(/\D/g, '').slice(0, 9) })} className="w-full p-2 border border-slate-900 dark:border-white bg-white dark:bg-surface font-body-md text-sm outline-none" />
                        </div>
                        <button onClick={handleCreateCustomer} className="w-full py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-data-label text-xs tracking-widest uppercase font-bold hover:bg-data-blue transition-colors">
                          GUARDAR CLIENTE
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex border border-slate-900 dark:border-white bg-white dark:bg-surface items-center p-2">
                           <span className="material-symbols-outlined text-[18px] text-slate-500 mr-2">search</span>
                           <input type="text" placeholder="BUSCAR CLIENTE..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if(!e.target.value) setSelectedCustomer(""); }} onFocus={() => setShowCustomerDropdown(true)} className="flex-1 bg-transparent outline-none font-body-md text-sm" />
                        </div>
                        {showCustomerDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface border-2 border-slate-900 dark:border-white max-h-48 overflow-y-auto z-50 brutal-scrollbar">
                            {filteredCustomers.length === 0 ? (
                              <div className="p-4 font-data-label text-xs uppercase text-slate-500">SIN RESULTADOS</div>
                            ) : (
                              filteredCustomers.map(c => (
                                <button key={c.id} onClick={() => handleCustomerSelect(c)} className="w-full text-left p-3 hover:bg-slate-900 hover:text-white transition-colors border-b border-slate-900/10 last:border-0 font-body-md text-sm uppercase">
                                  {c.name} <span className="font-data-label text-[10px] text-slate-500 block">{c.email}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de Items */}
                  <div className="flex-1 overflow-y-auto pr-2 brutal-scrollbar mb-4">
                    {newSaleItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-400 py-12">
                        <span className="material-symbols-outlined text-[48px] mb-2">shopping_cart</span>
                        <span className="font-data-label text-xs uppercase tracking-widest">CARRITO VACÍO</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newSaleItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim">
                            <div className="flex-1">
                              <p className="font-headline-lg-mobile text-sm uppercase truncate">{item.product_name}</p>
                              <p className="font-data-label text-[10px] tracking-widest text-slate-500">${formatPrice(item.unit_price)} C/U</p>
                            </div>
                            <div className="flex items-center border border-slate-900 dark:border-white bg-white dark:bg-surface">
                              <button onClick={() => updateItemQuantity(index, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-surface-bright"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                              <span className="w-8 text-center font-data-label text-xs">{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(index, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-surface-bright"><span className="material-symbols-outlined text-[16px]">add</span></button>
                            </div>
                            <div className="font-data-label font-bold text-sm w-16 text-right">
                              ${formatPrice(item.total)}
                            </div>
                            <button onClick={() => removeItemFromSale(index)} className="w-8 h-8 flex items-center justify-center border border-error text-error bg-error/10 hover:bg-error hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-6 mt-auto">
                    <div className="flex justify-between items-end mb-6">
                      <span className="font-data-label text-xs tracking-widest uppercase">TOTAL A PAGAR</span>
                      <span className="font-display-xl text-4xl font-black">${formatPrice(calculateSaleTotal())}</span>
                    </div>
                    <button 
                      onClick={handleCreateSale}
                      className="w-full min-h-[56px] border-2 border-transparent bg-data-blue text-white hover:bg-[#00FF66] hover:text-slate-900 font-data-label text-lg font-bold tracking-widest uppercase transition-colors"
                    >
                      PROCESAR VENTA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {isDetailsModalOpen && selectedSale && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-2xl relative">
            <div className="crosshair-tl" />
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">DETALLE DE VENTA</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 border-b border-slate-900/10 dark:border-white/10 pb-6">
                <div>
                  <p className="font-data-label text-[10px] tracking-widest uppercase text-slate-500 mb-1">Nº ORDEN</p>
                  <p className="font-headline-lg-mobile text-lg">{selectedSale.order_number || selectedSale.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-data-label text-[10px] tracking-widest uppercase text-slate-500 mb-1">FECHA</p>
                  <p className="font-data-label font-bold text-sm">{new Date(selectedSale.created_at).toLocaleString('es-ES')}</p>
                </div>
              </div>
              
              <div className="mb-6">
                 <p className="font-data-label text-[10px] tracking-widest uppercase text-slate-500 mb-2">PRODUCTOS</p>
                 <table className="w-full text-left text-sm border-collapse">
                   <thead className="bg-slate-100 dark:bg-surface-dim">
                     <tr>
                       <th className="p-2 font-data-label text-[10px] font-normal uppercase tracking-widest">ITEM</th>
                       <th className="p-2 font-data-label text-[10px] font-normal uppercase tracking-widest text-center">CANT</th>
                       <th className="p-2 font-data-label text-[10px] font-normal uppercase tracking-widest text-right">P.UNIT</th>
                       <th className="p-2 font-data-label text-[10px] font-normal uppercase tracking-widest text-right">TOTAL</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-900/10 dark:divide-white/10 border-b border-slate-900/10 dark:border-white/10">
                     {(selectedSale.items || []).map((item, idx) => (
                       <tr key={idx}>
                         <td className="p-2 font-body-md uppercase">{getSaleItemLabel(item)}</td>
                         <td className="p-2 font-data-label text-center">{getSaleItemQuantity(item)}</td>
                         <td className="p-2 font-data-label text-right">{formatCurrency(getSaleItemUnitPrice(item), selectedSale.currency || 'USD')}</td>
                         <td className="p-2 font-data-label text-right font-bold">{formatCurrency(getSaleItemTotal(item), selectedSale.currency || 'USD')}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              
              <div className="flex justify-end mt-6">
                <div className="w-48">
                  <div className="flex justify-between font-data-label text-xs mb-2"><span>SUBTOTAL:</span><span>{formatCurrency(selectedSale.subtotal, selectedSale.currency || 'USD')}</span></div>
                  <div className="flex justify-between font-data-label text-xs mb-2"><span>IMPUESTO:</span><span>{formatCurrency(selectedSale.tax, selectedSale.currency || 'USD')}</span></div>
                  <div className="flex justify-between font-data-label font-bold text-lg border-t-2 border-slate-900 dark:border-white pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(selectedSale.total, selectedSale.currency || 'USD')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
