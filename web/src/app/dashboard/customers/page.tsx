"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Plus, Search, RefreshCw, Users, Mail, Phone, MapPin, X } from "lucide-react";
import { SquarePenIcon, DeleteIcon } from "@/components/AnimatedIcons";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";
import { NotificationMessages } from "@/components/ui/NotificationMessages";
import { Customer, PERSON_TYPES, TAX_ID_LENGTH, ITEMS_PER_PAGE } from "@/types/customers";
import { useCustomersData } from "@/hooks/useCustomersData";

export default function CustomersPage() {
  const { user } = useAuth();
  const { 
    customers, 
    allCustomers, 
    loading, 
    errorMsg, 
    successMsg, 
    loadCustomers, 
    showSuccess, 
    showError 
  } = useCustomersData();
  
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    person_type: "V" as 'V' | 'E' | 'J' | 'G',
    tax_id_number: ""
  });

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.fromTo(".customer-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading, customers]);

  useEffect(() => {
    const filtered = allCustomers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );
    setCustomers(filtered);
    setCurrentPage(1);
  }, [search, allCustomers]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.email) {
        showError("Nombre y email son obligatorios");
        return;
      }

      // Validar longitud del tax_id (8-9 caracteres)
      if (formData.tax_id_number && (formData.tax_id_number.length < TAX_ID_LENGTH.min || formData.tax_id_number.length > TAX_ID_LENGTH.max)) {
        showError(`El número de cédula/RIF debe tener entre ${TAX_ID_LENGTH.min} y ${TAX_ID_LENGTH.max} caracteres`);
        return;
      }

      // Construir el tax_id completo: V-12345678-9
      let tax_id = undefined;
      if (formData.person_type && formData.tax_id_number) {
        const digitoVerificador = formData.tax_id_number.length === TAX_ID_LENGTH.max 
          ? formData.tax_id_number.slice(-1) 
          : '0';
        const numeroSinDigito = formData.tax_id_number.length === TAX_ID_LENGTH.max 
          ? formData.tax_id_number.slice(0, -1) 
          : formData.tax_id_number;
        
        tax_id = `${formData.person_type}-${numeroSinDigito}-${digitoVerificador}`;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        tax_id: tax_id,
        rif: tax_id
      };

      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
        showSuccess("Cliente actualizado con éxito");
      } else {
        await api.createCustomer(payload);
        showSuccess("Cliente registrado con éxito");
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || "Error al guardar el cliente");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await api.deleteCustomer(id);
      showSuccess("Cliente eliminado con éxito");
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || "Error al eliminar");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    
    // Parsear el tax_id existente
    let person_type = customer.person_type || 'V';
    let tax_id_number = '';
    
    if (customer.tax_id) {
      const parts = customer.tax_id.split('-');
      if (parts.length >= 2) {
        person_type = parts[0] as 'V' | 'E' | 'J' | 'G';
        tax_id_number = parts.slice(1).join('').replace(/-/g, '');
      }
    }
    
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      person_type,
      tax_id_number
    });
    setShowModal(true);
  };

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      email: "", 
      phone: "", 
      address: "", 
      person_type: "V", 
      tax_id_number: "" 
    });
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);

  return (
    <>
      <NotificationMessages errorMsg={errorMsg} successMsg={successMsg} />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Directorio de Clientes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tu cartera de clientes y contactos.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadCustomers()}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : ''}`} />
            </button>
            
            <button
              onClick={handleNewCustomer}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all shadow-md shadow-purple-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm dark:text-white text-lg"
          />
        </div>

        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentItems.length === 0 && !loading ? (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] border-dashed">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              No se encontraron clientes.
            </div>
          ) : (
            currentItems.map((customer) => (
              <div key={customer.id} className="customer-card bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full blur-2xl opacity-10 dark:opacity-20 -mr-6 -mt-6 pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                    {customer.name.charAt(0)}
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <SquarePenIcon />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">{customer.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{customer.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{customer.phone || 'Sin teléfono'}</span>
                  </div>
                  {customer.tax_id && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-md font-mono text-xs">
                        {customer.tax_id}
                      </span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                  placeholder="Nombre completo del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                  placeholder="+58 412-123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Persona</label>
                  <select
                    value={formData.person_type}
                    onChange={(e) => setFormData({ ...formData, person_type: e.target.value as 'V' | 'E' | 'J' | 'G' })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                  >
                    {PERSON_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type} - {type === 'V' ? 'Venezolano' : type === 'E' ? 'Extranjero' : type === 'J' ? 'Jurídico' : 'Gobierno'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cédula / RIF <span className="text-xs text-gray-500">({TAX_ID_LENGTH.min}-{TAX_ID_LENGTH.max} caracteres)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, TAX_ID_LENGTH.max);
                      setFormData({ ...formData, tax_id_number: value });
                    }}
                    maxLength={TAX_ID_LENGTH.max}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
                    placeholder={`12345678 o 123456789`}
                  />
                  {formData.tax_id_number && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.person_type}-{formData.tax_id_number.slice(0, TAX_ID_LENGTH.max-1)}-{formData.tax_id_number.length === TAX_ID_LENGTH.max ? formData.tax_id_number.slice(-1) : '0'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white resize-none"
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-md shadow-purple-500/20"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}