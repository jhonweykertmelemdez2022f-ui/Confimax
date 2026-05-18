"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { 
  Package, DollarSign, Users, RefreshCw, Plus, 
  Trash2, AlertTriangle, CheckCircle, Search, 
  Layers, ShoppingBag, Eye, Calendar, ShieldCheck
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
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "sales" | "customers">("overview");

  // Formulario nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "despensa",
    description: "",
    image: ""
  });

  // Formulario nuevo cliente
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Referencias para animaciones
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

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
        image: p.image_url || p.image || "/confimax-fondo-animado.png"
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

      // Muro de actividades recientes dinámico
      const activityFeed: any[] = [];
      
      mappedSales.slice(0, 3).forEach((s: any) => {
        activityFeed.push({
          id: `sale-${s.id}`,
          type: "sale",
          title: `Facturación Emitida #${s.id.slice(0, 6).toUpperCase()}`,
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

    if (!newProduct.name || !newProduct.sku || !newProduct.price || !newProduct.stock) {
      setErrorMsg("Por favor completa los campos requeridos del producto.");
      return;
    }

    try {
      await api.createProduct({
        name: newProduct.name,
        sku: newProduct.sku,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        description: newProduct.description,
        image: newProduct.image || undefined
      });

      setSuccessMsg("¡Producto insertado con éxito en PostgreSQL (Supabase)!");
      setNewProduct({
        name: "",
        sku: "",
        price: "",
        stock: "",
        category: "despensa",
        description: "",
        image: ""
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
            { id: "customers", name: "Base Clientes", icon: Users }
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
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
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
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-500">
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

      </div>
    </main>
  );
}
