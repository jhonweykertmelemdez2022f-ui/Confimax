-- ============================================================================
-- CONFIMAX - SCHEMA INICIAL PARA SUPABASE
-- Crea esquemas y tablas para todos los microservicios
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================================

-- ============================================================================
-- 1. CREAR ESQUEMAS (SCHEMAS)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS customers;

-- ============================================================================
-- 2. AUTH SERVICE - Tablas de autenticación
-- ============================================================================

-- Tabla: profiles (usuarios del sistema)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: sessions (sesiones activas - para tu backend)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Tabla: password_resets (recuperación de contraseña - para tu backend)
CREATE TABLE public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auth
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX idx_password_resets_token ON public.password_resets(token);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles (solo admins pueden gestionar)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (role = 'admin');

-- ============================================================================
-- 3. INVENTORY SERVICE - Gestión de inventario
-- ============================================================================

-- Tabla: categories (categorías de productos)
CREATE TABLE inventory.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: products (productos)
CREATE TABLE inventory.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES inventory.categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: stock (inventario por ubicación)
CREATE TABLE inventory.stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory.products(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER DEFAULT 10 CHECK (min_quantity >= 0),
    max_quantity INTEGER CHECK (max_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, location)
);

-- Tabla: stock_movements (movimientos de inventario)
CREATE TABLE inventory.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory.products(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para inventory
CREATE INDEX idx_inventory_categories_parent ON inventory.categories(parent_id);
CREATE INDEX idx_inventory_products_sku ON inventory.products(sku);
CREATE INDEX idx_inventory_products_category ON inventory.products(category_id);
CREATE INDEX idx_inventory_products_name ON inventory.products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_inventory_stock_product ON inventory.stock(product_id);
CREATE INDEX idx_inventory_stock_location ON inventory.stock(location);
CREATE INDEX idx_inventory_stock_low ON inventory.stock(quantity, min_quantity) WHERE quantity <= min_quantity;
CREATE INDEX idx_inventory_movements_product ON inventory.stock_movements(product_id);
CREATE INDEX idx_inventory_movements_created ON inventory.stock_movements(created_at DESC);

-- ============================================================================
-- 4. CUSTOMERS SERVICE - Gestión de clientes
-- ============================================================================

-- Tabla: customers (clientes)
CREATE TABLE customers.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    tax_id VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: addresses (direcciones de clientes)
CREATE TABLE customers.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers.customers(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
    name VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'España',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para customers
CREATE INDEX idx_customers_email ON customers.customers(email);
CREATE INDEX idx_customers_user ON customers.customers(user_id);
CREATE INDEX idx_customers_name ON customers.customers USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_addresses_customer ON customers.addresses(customer_id);
CREATE INDEX idx_addresses_type ON customers.addresses(type);

-- ============================================================================
-- 5. SALES SERVICE - Gestión de ventas
-- ============================================================================

-- Tabla: orders (pedidos)
CREATE TABLE sales.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    notes TEXT,
    shipping_address_id UUID REFERENCES customers.addresses(id),
    billing_address_id UUID REFERENCES customers.addresses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla: order_items (líneas de pedido)
CREATE TABLE sales.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory.products(id) ON DELETE SET NULL,
    sku VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: payments (pagos)
CREATE TABLE sales.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'cash', 'transfer', 'paypal', 'other')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sales
CREATE INDEX idx_orders_number ON sales.orders(order_number);
CREATE INDEX idx_orders_customer ON sales.orders(customer_id);
CREATE INDEX idx_orders_user ON sales.orders(user_id);
CREATE INDEX idx_orders_status ON sales.orders(status);
CREATE INDEX idx_orders_created ON sales.orders(created_at DESC);
CREATE INDEX idx_orders_customer_created ON sales.orders(customer_id, created_at DESC);
CREATE INDEX idx_order_items_order ON sales.order_items(order_id);
CREATE INDEX idx_order_items_product ON sales.order_items(product_id);
CREATE INDEX idx_payments_order ON sales.payments(order_id);
CREATE INDEX idx_payments_status ON sales.payments(status);

-- ============================================================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON inventory.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_products_updated_at BEFORE UPDATE ON inventory.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON inventory.stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_customers_updated_at BEFORE UPDATE ON customers.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_payments_updated_at BEFORE UPDATE ON sales.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DATOS INICIALES
-- ============================================================================

-- Usuario admin inicial
INSERT INTO public.profiles (email, name, role, is_active) VALUES
    ('admin@confimax.com', 'Administrador', 'admin', true);

-- Categorías iniciales
INSERT INTO inventory.categories (name, description) VALUES
    ('Electrónica', 'Productos electrónicos'),
    ('Ropa', 'Prendas de vestir'),
    ('Alimentos', 'Productos alimenticios'),
    ('Hogar', 'Artículos para el hogar');

-- ============================================================================
-- 8. COMENTARIOS EN TABLAS
-- ============================================================================

COMMENT ON SCHEMA inventory IS 'Esquema para gestión de inventario y productos';
COMMENT ON SCHEMA customers IS 'Esquema para gestión de clientes';
COMMENT ON SCHEMA sales IS 'Esquema para gestión de ventas y pedidos';

COMMENT ON TABLE public.profiles IS 'Usuarios del sistema';
COMMENT ON TABLE public.sessions IS 'Sesiones activas de usuarios';
COMMENT ON TABLE public.password_resets IS 'Tokens para recuperación de contraseña';

COMMENT ON TABLE inventory.categories IS 'Categorías de productos';
COMMENT ON TABLE inventory.products IS 'Catálogo de productos';
COMMENT ON TABLE inventory.stock IS 'Inventario por ubicación';
COMMENT ON TABLE inventory.stock_movements IS 'Historial de movimientos de inventario';

COMMENT ON TABLE customers.customers IS 'Clientes registrados';
COMMENT ON TABLE customers.addresses IS 'Direcciones de clientes';

COMMENT ON TABLE sales.orders IS 'Pedidos de venta';
COMMENT ON TABLE sales.order_items IS 'Líneas de pedido';
COMMENT ON TABLE sales.payments IS 'Pagos de pedidos';

-- ============================================================================
-- FIN
-- ============================================================================
