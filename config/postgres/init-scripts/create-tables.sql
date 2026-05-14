-- ============================================================================
-- SCRIPT SQL - Crear Tablas Básicas para Confimax
-- Ejecutar en PostgreSQL
-- ============================================================================

-- Crear esquema auth
CREATE SCHEMA IF NOT EXISTS auth;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS auth.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

-- Crear esquema inventory
CREATE SCHEMA IF NOT EXISTS inventory;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS inventory.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON inventory.products(sku);

-- Crear esquema sales
CREATE SCHEMA IF NOT EXISTS sales;

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS sales.orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON sales.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON sales.orders(status);

-- Crear esquema customers
CREATE SCHEMA IF NOT EXISTS customers;

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers.customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers.customers(email);

-- Crear esquema notifications
CREATE SCHEMA IF NOT EXISTS notifications;

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications.notifications(user_id);

-- Insertar usuario admin por defecto
INSERT INTO auth.users (email, password_hash, name, role, is_active)
VALUES ('admin@confimax.com', '$2a$10$placeholder_hash_reemplazar_con_real', 'Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Confirmación
SELECT 'Tablas creadas exitosamente' AS status;
SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema IN ('auth', 'inventory', 'sales', 'customers', 'notifications');
