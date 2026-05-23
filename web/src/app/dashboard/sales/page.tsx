"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { 
  Plus, Search, RefreshCw, AlertTriangle, CheckCircle, 
  DollarSign, Calendar, Eye, MoreHorizontal, X, Save,
  ShoppingCart, User, Box, Trash2, UserPlus, ChevronDown
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";

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

const formatPrice = (price: any) => {
  const num = parseFloat(String(price || 0));
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' }
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
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  
  // New sale form
  const [newSaleItems, setNewSaleItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [saleNotes, setSaleNotes] = useState("");
  
  // New customer form
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

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
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
      setErrorMsg("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(".sale-row",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, sales]);

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
    const total = newSaleItems.reduce((sum, item) => {
      const itemTotal = parseFloat(String(item.total || item.quantity * item.unit_price || 0));
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    return total;
  };

  const handleCreateSale = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      
      if (newSaleItems.length === 0) {
        setErrorMsg("Debe agregar al menos un producto");
        return;
      }

      const saleData = {
        customer_id: selectedCustomer || undefined,
        items: newSaleItems,
        status: 'pendiente',
        notes: saleNotes
      };

      await api.createSale(saleData);
      setSuccessMsg("Venta registrada exitosamente");
      setIsModalOpen(false);
      resetForm();
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear la venta");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.updateSaleStatus(id, newStatus);
      setSuccessMsg("Estado actualizado exitosamente");
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el estado");
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
        setErrorMsg("Nombre y email son obligatorios");
        return;
      }

      // Validar longitud del tax_id (8-9 caracteres)
      if (newCustomerForm.tax_id_number && (newCustomerForm.tax_id_number.length < 8 || newCustomerForm.tax_id_number.length > 9)) {
        setErrorMsg("El número de cédula/RIF debe tener entre 8 y 9 caracteres");
        return;
      }

      // Construir el tax_id completo: V-12345678-9
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
      
      // Agregar el nuevo cliente a la lista
      setCustomers([...customers, customerData]);
      
      // Seleccionar el nuevo cliente automáticamente
      setSelectedCustomer(customerData.id);
      setCustomerSearch(`${customerData.name} - ${customerData.email}`);
      
      setSuccessMsg("Cliente creado exitosamente");
      setShowNewCustomerForm(false);
      setShowCustomerDropdown(false);
      setNewCustomerForm({ 
        name: "", email: "", phone: "", address: "", 
        person_type: "V", tax_id_number: "" 
      });
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear el cliente");
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Ventas Registradas</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Historial completo de transacciones.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadAllData()}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Venta</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-[#222] flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por ID, número de orden o cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-[#222]">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron ventas.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((sale) => {
                    const statusInfo = getStatusInfo(sale.status);
                    return (
                      <tr key={sale.id} className="sale-row hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                              <ShoppingCart className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                                {sale.order_number || sale.id.substring(0, 8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {sale.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {sale.customer_name ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {sale.customer_name}
                                </p>
                                {sale.customer_email && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {sale.customer_email}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin cliente</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(sale.created_at).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-col sm:flex-row">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {sale.status === 'pendiente' && (
                              <select
                                value={sale.status}
                                onChange={(e) => handleUpdateStatus(sale.id, e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white cursor-pointer"
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900 dark:text-white text-lg">
                          ${formatPrice(sale.total)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetails(sale)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 hover:text-blue-500 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Nueva Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Nueva Venta</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Agrega productos para crear una nueva orden</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos disponibles */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Productos Disponibles</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-100 dark:border-[#222] rounded-2xl p-3">
                    {products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addItemToSale(product)}
                        className="w-full p-3 text-left rounded-xl border border-gray-100 dark:border-[#222] hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 dark:text-blue-400">${formatPrice(product.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carrito de venta */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Productos en la Venta</h3>
                  
                  {/* Buscador de cliente */}
                  <div className="mb-4" ref={customerDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente (Opcional)</label>
                      {!showNewCustomerForm && (
                        <button
                          onClick={() => {
                            setShowNewCustomerForm(true);
                            setShowCustomerDropdown(false);
                          }}
                          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          <UserPlus className="w-3 h-3" />
                          Nuevo cliente
                        </button>
                      )}
                    </div>

                    {showNewCustomerForm ? (
                      <div className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#333] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Registrar Nuevo Cliente</h4>
                          <button
                            onClick={() => {
                              setShowNewCustomerForm(false);
                              setNewCustomerForm({ 
                                name: "", email: "", phone: "", address: "", 
                                person_type: "V", tax_id_number: "" 
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] text-gray-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                          <input
                            type="text"
                            value={newCustomerForm.name}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                            placeholder="Nombre completo"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                          <input
                            type="email"
                            value={newCustomerForm.email}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                            placeholder="cliente@ejemplo.com"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                            <select
                              value={newCustomerForm.person_type}
                              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, person_type: e.target.value as 'V' | 'E' | 'J' | 'G' })}
                              className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                            >
                              <option value="V">V</option>
                              <option value="E">E</option>
                              <option value="J">J</option>
                              <option value="G">G</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                            <input
                              type="text"
                              value={newCustomerForm.phone}
                              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                              placeholder="+58 412..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cédula / RIF</label>
                            <input
                              type="text"
                              value={newCustomerForm.tax_id_number}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                setNewCustomerForm({ ...newCustomerForm, tax_id_number: value });
                              }}
                              maxLength={9}
                              className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                              placeholder="12345678"
                            />
                          </div>
                        </div>
                        {newCustomerForm.tax_id_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {newCustomerForm.person_type}-{newCustomerForm.tax_id_number.slice(0, 8)}-{newCustomerForm.tax_id_number.length === 9 ? newCustomerForm.tax_id_number.slice(-1) : '0'}
                          </p>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                          <textarea
                            rows={2}
                            value={newCustomerForm.address}
                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white resize-none"
                            placeholder="Dirección del cliente"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowNewCustomerForm(false);
                              setNewCustomerForm({ 
                                name: "", email: "", phone: "", address: "", 
                                person_type: "V", tax_id_number: "" 
                              });
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleCreateCustomer}
                            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                          >
                            Guardar Cliente
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Buscar cliente por nombre o email..."
                            value={customerSearch}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              setShowCustomerDropdown(true);
                              if (!e.target.value) {
                                setSelectedCustomer("");
                              }
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                            className="w-full bg-transparent outline-none dark:text-white"
                          />
                          {customerSearch && (
                            <button
                              onClick={() => {
                                setCustomerSearch("");
                                setSelectedCustomer("");
                                setShowCustomerDropdown(false);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {/* Dropdown de clientes */}
                        {showCustomerDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedCustomer("");
                                setCustomerSearch("");
                                setShowCustomerDropdown(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#222] transition-colors flex items-center gap-3 ${!selectedCustomer ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Sin cliente</p>
                                <p className="text-xs text-gray-500">Venta sin cliente registrado</p>
                              </div>
                              {!selectedCustomer && (
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" />
                              )}
                            </button>
                            
                            {filteredCustomers.length === 0 && customerSearch ? (
                              <div className="p-4">
                                <div className="text-center text-gray-500 dark:text-gray-400 mb-3">
                                  No se encontraron clientes
                                </div>
                                <button
                                  onClick={() => {
                                    setShowNewCustomerForm(true);
                                    setShowCustomerDropdown(false);
                                  }}
                                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Registrar cliente nuevo
                                </button>
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  onClick={() => handleCustomerSelect(customer)}
                                  className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#222] transition-colors flex items-center gap-3 ${selectedCustomer === customer.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                                    <p className="text-xs text-gray-500">{customer.email}</p>
                                  </div>
                                  {selectedCustomer === customer.id && (
                                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de items */}
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {newSaleItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Box className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay productos agregados</p>
                      </div>
                    ) : (
                      newSaleItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">${formatPrice(item.unit_price)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-center text-sm"
                            />
                            <button
                              onClick={() => removeItemFromSale(index)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notas */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Notas (Opcional)</label>
                    <textarea
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      placeholder="Agrega notas sobre esta venta..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white resize-none"
                    />
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                    <div>
                      <p className="text-sm opacity-80">Total de la Venta</p>
                      <p className="text-2xl font-bold">${formatPrice(calculateSaleTotal())}</p>
                    </div>
                    <DollarSign className="w-10 h-10 opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-[#222] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSale}
                disabled={newSaleItems.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Registrar Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Venta */}
      {isDetailsModalOpen && selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles de Venta {selectedSale.order_number || selectedSale.id.substring(0, 8).toUpperCase()}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Creada el {new Date(selectedSale.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Estado y totales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Estado</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(selectedSale.status).color}`}>
                      {getStatusInfo(selectedSale.status).label}
                    </span>
                    {selectedSale.status === 'pendiente' && (
                      <select
                        value={selectedSale.status}
                        onChange={(e) => {
                          handleUpdateStatus(selectedSale.id, e.target.value);
                          setSelectedSale({ ...selectedSale, status: e.target.value });
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
                  <p className="text-sm opacity-80">Total</p>
                  <p className="text-3xl font-bold">${formatPrice(selectedSale.total)}</p>
                </div>
              </div>

              {/* Desglose de totales */}
              <div className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Desglose</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">${formatPrice(selectedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Impuestos</span>
                    <span className="text-gray-900 dark:text-white">${formatPrice(selectedSale.tax)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Descuento</span>
                      <span className="text-red-500">-${formatPrice(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-[#222]">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">${formatPrice(selectedSale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Productos</h3>
                <div className="space-y-2">
                  {selectedSale.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.quantity} x ${formatPrice(item.unit_price)}
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${formatPrice(item.total || item.quantity * item.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {selectedSale.notes && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-200 dark:border-yellow-500/20">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider mb-1">Notas</p>
                  <p className="text-yellow-900 dark:text-yellow-200">{selectedSale.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-[#222] flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-[#222] text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
