"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
import { gsap } from "gsap";
import { Customer, PERSON_TYPES, TAX_ID_LENGTH, ITEMS_PER_PAGE } from "@/types/customers";
import { useCustomersData } from "@/hooks/useCustomersData";

export default function CustomersPage() {
  const { user } = useAuth();
  const { 
    customers, 
    setCustomers,
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

      if (formData.tax_id_number && (formData.tax_id_number.length < TAX_ID_LENGTH.min || formData.tax_id_number.length > TAX_ID_LENGTH.max)) {
        showError(`La cédula/RIF debe tener entre ${TAX_ID_LENGTH.min} y ${TAX_ID_LENGTH.max} caracteres`);
        return;
      }

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
        showSuccess("CLIENTE ACTUALIZADO");
      } else {
        await api.createCustomer(payload);
        showSuccess("CLIENTE REGISTRADO");
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || "ERROR AL GUARDAR CLIENTE");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRMACIÓN DE BORRADO: ¿Proceder?")) return;
    try {
      await api.deleteCustomer(id);
      showSuccess("CLIENTE ELIMINADO");
      await loadCustomers();
    } catch (err: any) {
      showError(err.message || "ERROR AL ELIMINAR");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    
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

      {/* Cabecera Brutalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-slate-900 dark:border-white pb-6 relative">
        <div className="crosshair-bl" />
        <div>
          <h1 className="font-headline-lg text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px]">group</span>
            DIRECTORIO DE CLIENTES
          </h1>
          <p className="font-data-label text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-2">
            GESTIÓN DE CARTERA Y CONTACTOS
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => loadCustomers()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
          <button 
            onClick={handleNewCustomer}
            className="btn-precision inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-data-blue dark:hover:bg-data-blue hover:text-white dark:hover:text-white min-h-[44px]"
          >
            <span className="material-symbols-outlined">person_add</span>
            NUEVO CLIENTE
          </button>
        </div>
      </div>

      {/* Controles de Búsqueda */}
      <div className="border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim p-4 relative">
        <div className="crosshair-tr" />
        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input 
            type="text" 
            placeholder="BUSCAR CLIENTE POR NOMBRE O EMAIL..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-surface-bright border-2 border-slate-900 dark:border-white font-data-label uppercase tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-data-blue focus:border-data-blue"
          />
        </div>
      </div>

      {/* Grid de Clientes */}
      <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentItems.length === 0 && !loading ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-surface border-2 border-slate-900 dark:border-white border-dashed">
            <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-700 mb-4">person_off</span>
            <p className="font-headline-lg-mobile text-lg uppercase tracking-tight text-slate-900 dark:text-white mb-2">SIN REGISTROS</p>
            <p className="font-data-label text-xs tracking-widest uppercase text-slate-500">NO SE ENCONTRARON CLIENTES</p>
          </div>
        ) : (
          currentItems.map((customer) => (
            <div key={customer.id} className="customer-card relative p-6 border-2 border-slate-900 dark:border-white bg-white dark:bg-surface flex flex-col group transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1">
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 border-2 border-slate-900 dark:border-white bg-data-blue flex items-center justify-center font-headline-lg text-xl font-bold uppercase text-white">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(customer)}
                    className="p-2 border border-slate-900 dark:border-white text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-surface-dim transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 border border-error bg-error/10 text-error hover:bg-error hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
              
              <h3 className="font-headline-lg-mobile text-xl uppercase tracking-tighter text-slate-900 dark:text-white mb-4 line-clamp-1">
                {customer.name}
              </h3>
              
              <div className="space-y-3 font-data-label text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">mail</span>
                  <span className="truncate">{customer.email || 'SIN CORREO'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">phone</span>
                  <span className="truncate">{customer.phone || 'SIN TELÉFONO'}</span>
                </div>
                {customer.tax_id && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">badge</span>
                    <span className="px-2 py-0.5 border border-slate-900/20 dark:border-white/20 bg-slate-50 dark:bg-surface-dim">
                      {customer.tax_id}
                    </span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 border-t border-slate-900/10 dark:border-white/10 pt-3 mt-3">
                    <span className="material-symbols-outlined text-[16px] text-slate-500 mt-0.5">location_on</span>
                    <span className="line-clamp-2 leading-relaxed">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Modal Brutalista */}
      {showModal && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-surface border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden">
            <div className="crosshair-tl" />
            <div className="crosshair-tr" />
            
            <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-surface-dim flex items-center justify-between">
              <h2 className="font-headline-lg-mobile text-xl uppercase tracking-tighter">
                {editingCustomer ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">NOMBRE COMPLETO *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md"
                    placeholder="Nombre o Razón Social"
                  />
                </div>
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">EMAIL *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">TIPO PERSONA</label>
                  <select
                    value={formData.person_type}
                    onChange={(e) => setFormData({ ...formData, person_type: e.target.value as 'V' | 'E' | 'J' | 'G' })}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-data-label uppercase text-sm"
                  >
                    {PERSON_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    CÉDULA / RIF ({TAX_ID_LENGTH.min}-{TAX_ID_LENGTH.max})
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, TAX_ID_LENGTH.max);
                      setFormData({ ...formData, tax_id_number: value });
                    }}
                    maxLength={TAX_ID_LENGTH.max}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md"
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">TELÉFONO</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md"
                    placeholder="+58 412..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-data-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">DIRECCIÓN FÍSICA</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border-2 border-slate-900 dark:border-white bg-transparent p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-data-blue font-body-md resize-none"
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-slate-900 dark:border-white mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 min-h-[44px] font-data-label text-xs font-bold uppercase tracking-widest border-2 border-slate-900 dark:border-white hover:bg-slate-100 dark:hover:bg-surface-dim transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] font-data-label text-xs font-bold uppercase tracking-widest border-2 border-slate-900 dark:border-white bg-data-blue text-white hover:bg-slate-900 transition-colors"
                >
                  {editingCustomer ? 'ACTUALIZAR REGISTRO' : 'CREAR REGISTRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}