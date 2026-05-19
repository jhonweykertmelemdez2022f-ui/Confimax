"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { 
  Package, DollarSign, Users, RefreshCw, Plus, 
  Trash2, AlertTriangle, CheckCircle, Search, 
  Layers, ShoppingBag, Eye, Calendar, ShieldCheck,
  Database, Activity
} from "lucide-react";
import { gsap } from "gsap";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image?: string;
  expiration_date?: string;
}

interface Sale {
  id: string;
  customerId?: string;
  total: number;
  paymentMethod: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Estados de carga e interfaz
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "sales" | "customers" | "users" | "audit">("overview");

  // Formulario nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "despensa",
    description: "",
    image: "",
    expiration_date: ""
  });

  // Formulario nuevo cliente
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Estado para usuarios (Admin only)
  interface SystemUser {
    id: string;
    username: string;
    name?: string;
    email: string;
    role: string;
  }
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "vendor"
  });

  // Referencias para animaciones
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Estado para Edición (CRUD)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // 1. Proteger ruta: solo administradores y vendedores
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "cliente") {
        router.push("/catalogo");
      }
    }
  }, [user, authLoading, router]);

  // 2. Cargar datos del Dashboard
  const loadDashboardData = async () => {
    if (!user || user.role === "cliente") return;
    
    try {
      setLoadingData(true);
      setErrorMsg("");

      // Cargar productos, ventas y clientes en paralelo
      const [productsRes, salesRes, customersRes] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getSales().catch(() => []),
        api.getCustomers().catch(() => [])
      ]) as any[];

      // Mapear productos
      const mappedProducts = (Array.isArray(productsRes.data || productsRes) ? (productsRes.data || productsRes) : []).map((p: any) => ({
        id: p.id || p.product_id,
        sku: p.sku || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        name: p.name || "Producto",
        price: parseFloat(p.price || p.unit_price || 0),
        stock: parseInt(p.stock || p.stock_quantity || 0),
        category: p.category || "despensa",
        description: p.description || "",
        image: p.image_url || p.image || "/confimax-fondo-animado.png",
        expiration_date: p.expiration_date || null
      }));

      // Mapear ventas
      const mappedSales = (Array.isArray(salesRes.data || salesRes) ? (salesRes.data || salesRes) : []).map((s: any) => ({
        id: s.id || String(s.sale_id),
        customerId: s.customerId || s.customer_id,
        total: parseFloat(s.total || s.total_amount || 0),
        paymentMethod: s.paymentMethod || s.payment_method || "Efectivo",
        created_at: s.created_at || s.sale_date || new Date().toISOString()
      }));

      // Mapear clientes
      const mappedCustomers = (Array.isArray(customersRes.data || customersRes) ? (customersRes.data || customersRes) : []).map((c: any) => ({
        id: c.id || c.customer_id,
        name: c.name || "Cliente Sin Nombre",
        email: c.email || "S/E",
        phone: c.phone || "S/T",
        address: c.address || ""
      }));

      setProducts(mappedProducts);
      setSales(mappedSales);
      setCustomers(mappedCustomers);

      // Cargar usuarios del sistema si es admin
      let usersList: any[] = [];
      let logsList: any[] = [];
      if (user.role === 'admin') {
        try {
          const usersRes = await api.getUsers() as any;
          usersList = Array.isArray(usersRes?.data || usersRes) ? (usersRes?.data || usersRes) : [];
        } catch (e) {
          console.error("Error al cargar usuarios de auth-service:", e);
        }

        try {
          const logsRes = await api.getAuditLogs({ limit: 100 }) as any;
          logsList = Array.isArray(logsRes?.data || logsRes) ? (logsRes?.data || logsRes) : [];
        } catch (e) {
          console.error("Error al cargar logs de auditoría de backend-service:", e);
        }
      }
      setSystemUsers(usersList);
      setAuditLogs(logsList);

      // Muro de actividades recientes dinámico
      const activityFeed: any[] = [];
      
      mappedSales.slice(0, 3).forEach((s: any) => {
        activityFeed.push({
          id: `sale-${s.id}`,
          type: "sale",
          title: `Facturación Emitida #${(s.id || "").slice(0, 6).toUpperCase()}`,
          desc: `Método: ${s.paymentMethod}`,
          meta: `$${s.total.toFixed(2)}`,
          date: new Date(s.created_at).toLocaleDateString(),
          icon: ShoppingBag,
          iconColor: "text-data-blue bg-data-blue/10 border-data-blue/20"
        });
      });

      mappedCustomers.slice(0, 2).forEach((c: any) => {
        activityFeed.push({
          id: `cust-${c.id}`,
          type: "customer",
          title: `Registro de Cliente`,
          desc: `${c.name} (${c.email})`,
          meta: "NUEVO",
          date: "Hoy",
          icon: Users,
          iconColor: "text-accent-pink bg-accent-pink/10 border-accent-pink/20"
        });
      });

      setActivities(activityFeed);

    } catch (err: any) {
      console.error("Error al cargar datos en el dashboard administrador:", err);
      setErrorMsg(err.message || "Error al sincronizar datos transaccionales del servidor cloud.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // 3. Ejecutar animaciones de entrada
  useEffect(() => {
    if (loadingData || authLoading) return;
    
    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, [loadingData, authLoading, activeTab]);

  // 4. Crear producto handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const nameTrim = newProduct.name.trim();
    const skuTrim = newProduct.sku.trim().toUpperCase();
    const priceVal = parseFloat(newProduct.price);
    const stockVal = parseInt(newProduct.stock, 10);

    // Validar Campos Obligatorios
    if (!nameTrim || !skuTrim || !newProduct.price || !newProduct.stock) {
      setErrorMsg("Por favor completa todos los campos requeridos marcados con (*).");
      return;
    }

    // Validar Formato del SKU (Alfanumérico y guiones)
    const skuRegex = /^[A-Z0-9-_]+$/;
    if (!skuRegex.test(skuTrim)) {
      setErrorMsg("El código SKU solo puede contener letras, números, guiones (-) y guiones bajos (_).");
      return;
    }

    if (skuTrim.length < 3) {
      setErrorMsg("El código SKU debe tener al menos 3 caracteres.");
      return;
    }

    // Validar Precio Positivo
    if (isNaN(priceVal) || priceVal <= 0) {
      setErrorMsg("El precio del producto debe ser un número positivo mayor a 0.");
      return;
    }

    // Validar Stock No Negativo
    if (isNaN(stockVal) || stockVal < 0) {
      setErrorMsg("El stock inicial no puede ser un número negativo.");
      return;
    }

    try {
      await api.createProduct({
        name: nameTrim,
        sku: skuTrim,
        price: priceVal,
        stock: stockVal,
        category: newProduct.category,
        description: newProduct.description.trim(),
        image: newProduct.image.trim() || undefined,
        expiration_date: newProduct.expiration_date.trim() || undefined
      });

      setSuccessMsg(`¡Producto "${nameTrim}" insertado con éxito en PostgreSQL (Supabase)!`);
      setNewProduct({
        name: "",
        sku: "",
        price: "",
        stock: "",
        category: "despensa",
        description: "",
        image: "",
        expiration_date: ""
      });

      // Recargar datos actualizados
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error al crear producto:", err);
      setErrorMsg(err.message || "Error al conectar con el microservicio de inventario.");
    }
  };

  // 5. Crear cliente handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      setErrorMsg("Por favor completa los campos requeridos del cliente.");
      return;
    }

    try {
      await api.createCustomer(newCustomer);
      setSuccessMsg("¡Cliente registrado exitosamente!");
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: ""
      });

      // Recargar datos actualizados
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error al crear cliente:", err);
      setErrorMsg(err.message || "Error al conectar con el microservicio de clientes.");
    }
  };

  // 6. Crear usuario handler (Admin only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newUser.username || !newUser.email || !newUser.role) {
      setErrorMsg("Por favor completa todos los campos requeridos del usuario.");
      return;
    }

    try {
      await api.createUser(newUser);
      setSuccessMsg(`¡Usuario "${newUser.username}" registrado exitosamente en auth-service!`);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "vendor"
      });
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error al crear usuario:", err);
      setErrorMsg(err.message || "Error al conectar con el microservicio de autenticación.");
    }
  };

  // 7. Eliminar usuario handler (Admin only)
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.deleteUser(id);
      setSuccessMsg(`¡Usuario "${name}" eliminado exitosamente!`);
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err);
      setErrorMsg(err.message || "Error al conectar con el microservicio de autenticación.");
    }
  };

  // --- CRUD Adicional: Productos ---
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.deleteProduct(id);
      setSuccessMsg(`¡Producto "${name}" eliminado exitosamente!`);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar el producto.");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price.toString()),
        stock_quantity: parseInt(editingProduct.stock.toString(), 10),
        description: editingProduct.description
      });
      setSuccessMsg(`¡Producto "${editingProduct.name}" actualizado exitosamente!`);
      setEditingProduct(null);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el producto.");
    }
  };

  // --- CRUD Adicional: Clientes ---
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el cliente "${name}"?`)) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.deleteCustomer(id);
      setSuccessMsg(`¡Cliente "${name}" eliminado exitosamente!`);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar el cliente.");
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.updateCustomer(editingCustomer.id, {
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        address: editingCustomer.address
      });
      setSuccessMsg(`¡Cliente "${editingCustomer.name}" actualizado exitosamente!`);
      setEditingCustomer(null);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el cliente.");
    }
  };

  // --- CRUD Adicional: Usuarios ---
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.updateUser(editingUser.id, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role
      });
      setSuccessMsg(`¡Usuario "${editingUser.username}" actualizado exitosamente!`);
      setEditingUser(null);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el usuario.");
    }
  };

  // --- CRUD Adicional: Ventas ---
  const handleDeleteSale = async (id: string) => {
    if (!confirm(`¿Estás seguro de que deseas anular esta venta? Esta acción no se puede deshacer y el inventario no se restaurará automáticamente.`)) return;
    setErrorMsg(""); setSuccessMsg("");
    try {
      await api.deleteSale(id);
      setSuccessMsg(`¡Venta anulada exitosamente!`);
      await loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al anular la venta.");
    }
  };

  // Pantalla de carga técnica ultra premium
  if (authLoading || (user && user.role !== "cliente" && loadingData)) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-white dark:bg-background">
        <div className="relative w-16 h-16 mb-4">
          <RefreshCw className="w-12 h-12 text-data-blue animate-spin absolute top-2 left-2" />
          <div className="w-16 h-16 border-2 border-slate-900/10 dark:border-white/10 rounded-full" />
        </div>
        <p className="font-data-label text-xs tracking-widest text-slate-500 dark:text-slate-400 uppercase animate-pulse">
          Sincronizando Consola de Control Cloud...
        </p>
      </div>
    );
  }

  // No autorizado
  if (!user || user.role === "cliente") {
    return null;
  }

  return (
    <main ref={containerRef} className="min-h-screen pt-8 pb-20 bg-white dark:bg-background text-slate-900 dark:text-white">
      <div className="w-full px-margin-page">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900/10 dark:border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-data-label text-[10px] bg-accent-pink/15 text-accent-pink px-2.5 py-0.5 border border-accent-pink/30 uppercase flex items-center gap-1.5 rounded-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Módulo de Administración: {user.role}
              </span>
              <span className="font-data-label text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                {user.name} // {user.email}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg uppercase mb-1">CONSOLA DE CONTROL DISTRIBUIDA</h1>
            <p className="font-body-md text-slate-600 dark:text-slate-400">
              Gestión centralizada de stock, facturación, auditorías y telemetría de clientes en Supabase Cloud.
            </p>
          </div>
          <button 
            id="btn-sync-dashboard"
            onClick={loadDashboardData}
            className="flex items-center gap-2 border border-slate-900 dark:border-white px-4 py-2 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-background font-data-label text-data-label uppercase transition-all"
            aria-label="Sincronizar consola de datos"
          >
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
        </header>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="bg-error/15 border border-error p-4 mb-6 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-data-label text-xs uppercase text-error mb-1">Error detectado</h4>
              <p className="font-body-sm text-xs text-slate-600 dark:text-slate-400">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#00FF66]/10 border border-[#00FF66] p-4 mb-6 flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-[#00FF66] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-data-label text-xs uppercase text-[#00FF66] mb-1">Operación exitosa</h4>
              <p className="font-body-sm text-xs text-slate-600 dark:text-slate-400">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border border-slate-900 dark:border-white p-1 mb-8 bg-slate-50 dark:bg-surface-dim max-w-full overflow-x-auto">
          {[
            { id: "overview", name: "Resumen General", icon: Layers },
            { id: "inventory", name: "Gestión Stock", icon: Package },
            { id: "sales", name: "Comprobantes Ventas", icon: DollarSign },
            { id: "customers", name: "Base Clientes", icon: Users },
            ...(user.role === 'admin' ? [
              { id: "users", name: "Gestión Usuarios", icon: ShieldCheck },
              { id: "audit", name: "Auditoría MongoDB", icon: RefreshCw }
            ] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-select-${tab.id}`}
                onClick={() => { setActiveTab(tab.id as any); setSuccessMsg(""); setErrorMsg(""); }}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-data-label text-data-label uppercase border border-transparent transition-all whitespace-nowrap ${
                  active 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-background" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.name}
              </button>
            );
          })}
        </div>

        {/* CONTENIDOS DE PESTAÑAS */}

        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metricas */}
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 relative group hover:border-data-blue transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Package className="w-6 h-6 text-data-blue" />
                  <span className="font-data-label text-[10px] text-slate-500 dark:text-slate-400">01 // INV</span>
                </div>
                <h3 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-1">
                  {products.length}
                </h3>
                <p className="font-data-label text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Productos Registrados
                </p>
                <div className="w-full h-0.5 bg-slate-200 dark:bg-white/10 mt-4 group-hover:bg-data-blue transition-colors" />
              </div>

              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 relative group hover:border-[#00FF66] transition-all">
                <div className="flex justify-between items-center mb-4">
                  <DollarSign className="w-6 h-6 text-[#00FF66]" />
                  <span className="font-data-label text-[10px] text-slate-500 dark:text-slate-400">02 // SLS</span>
                </div>
                <h3 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-1">
                  {sales.length}
                </h3>
                <p className="font-data-label text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Comprobantes Emitidos
                </p>
                <div className="w-full h-0.5 bg-slate-200 dark:bg-white/10 mt-4 group-hover:bg-[#00FF66] transition-colors" />
              </div>

              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 relative group hover:border-accent-pink transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Users className="w-6 h-6 text-accent-pink" />
                  <span className="font-data-label text-[10px] text-slate-500 dark:text-slate-400">03 // CST</span>
                </div>
                <h3 className="font-display-xl text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-1">
                  {customers.length}
                </h3>
                <p className="font-data-label text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Clientes Vinculados
                </p>
                <div className="w-full h-0.5 bg-slate-200 dark:bg-white/10 mt-4 group-hover:bg-accent-pink transition-colors" />
              </div>

            </div>

            {/* Actividad Reciente */}
            <section className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-data-blue" /> Historial de Actividad Reciente (Cloud Audits)
              </h2>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {activities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <article key={act.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 border rounded-sm ${act.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-data-value text-sm text-slate-900 dark:text-white uppercase">
                            {act.title}
                          </h4>
                          <p className="font-body-sm text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {act.desc}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-data-value text-sm font-semibold block text-slate-900 dark:text-white">
                          {act.meta}
                        </span>
                        <span className="font-data-label text-[10px] text-slate-500 uppercase block mt-1">
                          {act.date}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 2. INVENTORY */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
            
            {/* Lista de Productos */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 overflow-hidden">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4 text-data-blue" /> Inventario de Productos (Supabase)
              </h2>
              
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-white font-data-label text-[11px] text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Precio</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Vencimiento</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-body-sm">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-bright/50">
                        <td className="py-3.5 px-4 font-mono text-xs">{p.sku}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white uppercase">{p.name}</td>
                        <td className="py-3.5 px-4 uppercase text-xs text-data-blue">{p.category}</td>
                        <td className="py-3.5 px-4 font-mono font-bold">${p.price.toFixed(2)}</td>
                        <td className={`py-3.5 px-4 font-mono font-bold ${p.stock <= 10 ? "text-error" : "text-[#00FF66]"}`}>
                          {p.stock} U
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {p.expiration_date ? new Date(p.expiration_date).toLocaleDateString() : "NO VENCE"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => setEditingProduct(p)} className="p-1.5 bg-data-blue/10 text-data-blue hover:bg-data-blue hover:text-white transition-colors" title="Editar Producto">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white transition-colors" title="Eliminar Producto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          No hay productos en la base de datos cloud.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crear Producto Panel */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 h-fit">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2 border-b border-slate-900/10 dark:border-white/10 pb-3">
                <Plus className="w-4 h-4 text-data-blue" /> Agregar Producto
              </h2>
              
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label htmlFor="prod-name" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    id="prod-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Harina PAN 1kg"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm uppercase font-body-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="prod-sku" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    id="prod-sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                    placeholder="HAR-PAN-1KG"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-price" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                      Precio USD *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="prod-price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="1.25"
                      className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="prod-stock" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                      Stock inicial *
                    </label>
                    <input
                      type="number"
                      id="prod-stock"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="100"
                      className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="prod-cat" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Categoría *
                  </label>
                  <select
                    id="prod-cat"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-data-label uppercase"
                  >
                    <option value="despensa">Despensa</option>
                    <option value="frescos">Frescos</option>
                    <option value="lácteos">Lácteos</option>
                    <option value="limpieza">Limpieza</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-desc" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="prod-desc"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Escribe detalles del producto aquí..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-body-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prod-expiration" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    id="prod-expiration"
                    value={newProduct.expiration_date}
                    onChange={(e) => setNewProduct({ ...newProduct, expiration_date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-body-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prod-img" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    URL de la Imagen
                  </label>
                  <input
                    type="text"
                    id="prod-img"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://example.com/imagen.png"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-body-sm"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-submit-new-product"
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-background border border-slate-900 dark:border-white py-3 hover:bg-slate-800 dark:hover:bg-slate-100 font-data-label text-data-label uppercase transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Guardar Producto
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 3. SALES */}
        {activeTab === "sales" && (
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 overflow-hidden">
            <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-data-blue" /> Auditoría de Ventas Emitidas (PostgreSQL + Mongo Logs)
            </h2>
            
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-900 dark:border-white font-data-label text-[11px] text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-4">Código de Venta</th>
                    <th className="py-3 px-4">ID de Cliente</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Monto Facturado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-body-sm">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-surface-bright/50">
                      <td className="py-3.5 px-4 font-mono text-xs uppercase text-slate-900 dark:text-white">
                        #{s.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {s.customerId ? s.customerId.slice(0, 8).toUpperCase() : "MOSTRADOR // VENTA DIRECTA"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold uppercase">{s.paymentMethod}</td>
                      <td className="py-3.5 px-4 flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-data-blue">${s.total.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => handleDeleteSale(s.id)} className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white transition-colors rounded" title="Anular Venta">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No hay registros de facturación almacenados en el ledger transaccional.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS */}
        {activeTab === "customers" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
            
            {/* Tabla de Clientes */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 overflow-hidden">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-data-blue" /> Ledger de Clientes Registrados
              </h2>
              
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-white font-data-label text-[11px] text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Nombre Completo</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4">Dirección</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-body-sm">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-surface-bright/50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white uppercase">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{c.email}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{c.phone}</td>
                        <td className="py-3.5 px-4 text-slate-500 uppercase text-xs truncate max-w-[200px]" title={c.address}>
                          {c.address || "No especificada"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => setEditingCustomer(c)} className="p-1.5 bg-data-blue/10 text-data-blue hover:bg-data-blue hover:text-white transition-colors rounded" title="Editar Cliente">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteCustomer(c.id, c.name)} className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white transition-colors rounded" title="Eliminar Cliente">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          No hay clientes vinculados a la base de datos centralizada de Supabase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crear Cliente Panel */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 h-fit">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2 border-b border-slate-900/10 dark:border-white/10 pb-3">
                <Plus className="w-4 h-4 text-accent-pink" /> Registrar Cliente
              </h2>
              
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label htmlFor="cust-name" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="cust-name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm uppercase font-body-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cust-email" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Email Corporativo / Personal *
                  </label>
                  <input
                    type="email"
                    id="cust-email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="juan.perez@example.com"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cust-phone" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    id="cust-phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+58 412 1234567"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cust-address" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Dirección Residencial
                  </label>
                  <textarea
                    id="cust-address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Av. Bolívar, Res. Las Torres, Apto 4B"
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm uppercase font-body-sm"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-submit-new-customer"
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-background border border-slate-900 dark:border-white py-3 hover:bg-slate-800 dark:hover:bg-slate-100 font-data-label text-data-label uppercase transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Guardar Cliente
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5. USERS (ADMIN ONLY) */}
        {activeTab === "users" && user.role === 'admin' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
            
            {/* Tabla de Usuarios */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 overflow-hidden">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-data-blue" /> Cuentas de Acceso en auth-service
              </h2>
              
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-white font-data-label text-[11px] text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rol de Acceso</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-body-sm">
                    {systemUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-surface-bright/50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white uppercase">{u.name || u.username}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                            u.role === 'admin' 
                              ? 'bg-accent-pink/15 text-accent-pink border-accent-pink/30' 
                              : u.role === 'vendor'
                              ? 'bg-data-blue/15 text-data-blue border-data-blue/30'
                              : 'bg-slate-500/15 text-slate-500 border-slate-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => setEditingUser(u)} className="p-1.5 bg-data-blue/10 text-data-blue hover:bg-data-blue hover:text-white transition-colors rounded" title="Editar Usuario">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          {(u.name || u.username || "").toLowerCase() !== (user?.name || "").toLowerCase() ? (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name || u.username)}
                              className="p-1.5 bg-error/10 text-error hover:bg-error hover:text-white transition-colors rounded" title="Eliminar Usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="font-data-label text-[10px] text-slate-500 uppercase px-2">Actual</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {systemUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-500">
                          No hay usuarios registrados en el microservicio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crear Usuario Panel */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 h-fit">
              <h2 className="font-data-label text-sm uppercase mb-6 tracking-wide flex items-center gap-2 border-b border-slate-900/10 dark:border-white/10 pb-3">
                <Plus className="w-4 h-4 text-accent-pink" /> Registrar Cuenta
              </h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label htmlFor="usr-name" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="usr-name"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="jhon_weykert"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-body-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="usr-email" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="usr-email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="jhon.melendez@example.com"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="usr-pass" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    id="usr-pass"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Confimax123*"
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="usr-role" className="font-data-label text-xs uppercase text-slate-500 block mb-1">
                    Rol de Acceso *
                  </label>
                  <select
                    id="usr-role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-surface-dim border border-slate-900 dark:border-white py-2 px-3 focus:outline-none focus:border-data-blue text-sm font-data-label uppercase"
                  >
                    <option value="vendor">Vendedor (Vendor)</option>
                    <option value="admin">Administrador (Admin)</option>
                    <option value="manager">Gerente (Manager)</option>
                    <option value="customer">Cliente (Customer)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  id="btn-submit-new-user"
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-background border border-slate-900 dark:border-white py-3 hover:bg-slate-800 dark:hover:bg-slate-100 font-data-label text-data-label uppercase transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Crear Usuario
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 6. AUDIT (ADMIN ONLY) */}
        {activeTab === "audit" && user.role === 'admin' && (
          <div className="space-y-6">
            
            {/* Cabecera & Stats de MongoDB */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-5 flex items-center gap-4">
                <div className="p-3 bg-data-blue/10 border border-data-blue/20 text-data-blue">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-data-label text-[10px] text-slate-500 uppercase tracking-wider">Base de Datos</div>
                  <div className="font-data-label text-sm uppercase text-slate-900 dark:text-white">MongoDB Atlas</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-5 flex items-center gap-4">
                <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-data-label text-[10px] text-slate-500 uppercase tracking-wider">Estado Conexión</div>
                  <div className="font-data-label text-sm uppercase text-[#00FF66] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></span> Activo
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-5 flex items-center gap-4">
                <div className="p-3 bg-accent-pink/10 border border-accent-pink/20 text-accent-pink">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-data-label text-[10px] text-slate-500 uppercase tracking-wider">Logs en Vista</div>
                  <div className="font-data-label text-sm uppercase text-slate-900 dark:text-white">{auditLogs.length} Registros</div>
                </div>
              </div>
            </div>

            {/* Listado de Logs de Auditoría */}
            <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-900/10 dark:border-white/10 pb-4">
                <h2 className="font-data-label text-sm uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-pink" /> Registro de Operaciones y Auditoría de Seguridad (MongoDB Logs)
                </h2>
                <button
                  onClick={async () => {
                    setLoadingData(true);
                    try {
                      const logsRes = await api.getAuditLogs({ limit: 100 }) as any;
                      setAuditLogs(Array.isArray(logsRes?.data || logsRes) ? (logsRes?.data || logsRes) : []);
                    } catch (e) {
                      console.error(e);
                    }
                    setLoadingData(false);
                  }}
                  className="font-data-label text-[10px] uppercase border border-slate-900 dark:border-white px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-surface-bright transition-colors"
                >
                  Sincronizar Logs
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-white font-data-label text-[11px] text-slate-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Operación</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Entidad</th>
                      <th className="py-3 px-4">ID Registro</th>
                      <th className="py-3 px-4">IP / Endpoint</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-body-sm text-xs">
                    {auditLogs.map((log, idx) => (
                      <tr key={log._id || idx} className="hover:bg-slate-50 dark:hover:bg-surface-bright/50">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm border ${
                            log.operation === 'CREATE'
                              ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30'
                              : log.operation === 'UPDATE'
                              ? 'bg-data-blue/15 text-data-blue border-data-blue/30'
                              : log.operation === 'DELETE'
                              ? 'bg-error/15 text-error border-error/30'
                              : 'bg-accent-pink/15 text-accent-pink border-accent-pink/30'
                          }`}>
                            {log.operation}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white uppercase whitespace-nowrap">
                          {log.username || 'Sistema'}
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-400">
                          {log.entity}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {log.recordId ? `${log.recordId.slice(0, 8)}...` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          <div>{log.ipAddress || '127.0.0.1'}</div>
                          <div className="text-[9px] text-slate-500 truncate max-w-[180px]" title={log.endpoint}>
                            {log.endpoint || '/'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-data-label text-[9px] uppercase ${
                            log.status === 'success' ? 'text-[#00FF66]' : 'text-error'
                          }`}>
                            {log.status === 'success' ? 'Éxito' : 'Fallo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500">
                          No hay logs de auditoría registrados en MongoDB Atlas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* --- Modales de Edición --- */}
      {/* Modal Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-headline-lg-mobile uppercase mb-4 text-slate-900 dark:text-white border-b border-slate-900 dark:border-white pb-2">Editar Producto</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Nombre</label>
                  <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Precio ($)</label>
                  <input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Stock (Unidades)</label>
                  <input type="number" required value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Descripción</label>
                  <textarea rows={3} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-xs uppercase">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-data-blue text-white hover:bg-blue-600 transition-colors font-data-label text-xs uppercase">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-headline-lg-mobile uppercase mb-4 text-slate-900 dark:text-white border-b border-slate-900 dark:border-white pb-2">Editar Cliente</h3>
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Nombre Completo</label>
                  <input type="text" required value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Email</label>
                  <input type="email" required value={editingCustomer.email} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Teléfono</label>
                  <input type="text" required value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Dirección</label>
                  <input type="text" value={editingCustomer.address || ""} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-xs uppercase">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-data-blue text-white hover:bg-blue-600 transition-colors font-data-label text-xs uppercase">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface border border-slate-900 dark:border-white p-6 max-w-lg w-full shadow-2xl">
            <h3 className="font-headline-lg-mobile uppercase mb-4 text-slate-900 dark:text-white border-b border-slate-900 dark:border-white pb-2">Editar Usuario</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Nombre de Usuario</label>
                  <input type="text" required value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Email</label>
                  <input type="email" required value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-data-label uppercase text-slate-500 mb-1">Rol</label>
                  <select required value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-slate-50 dark:bg-background border border-slate-900/20 dark:border-white/20 p-2 font-body-sm text-slate-900 dark:text-white">
                    <option value="vendor">Vendedor (Limitado)</option>
                    <option value="admin">Administrador (Total)</option>
                    <option value="cliente">Cliente (Solo Compras)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-bright transition-colors font-data-label text-xs uppercase">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-data-blue text-white hover:bg-blue-600 transition-colors font-data-label text-xs uppercase">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
