-- =====================================================
-- ÍNDICES DE PERFORMANCE PARA CONFIMAX
-- Optimizaciones para consultas frecuentes
-- =====================================================

-- =====================================================
-- 1. ÍNDICES PARA INVENTARIO (Productos)
-- =====================================================

-- Búsqueda rápida por código de barras (escaneo en punto de venta)
CREATE INDEX IF NOT EXISTS idx_products_barcode_active 
ON products(barcode) 
WHERE deleted_at IS NULL;

-- Búsqueda por código interno (búsqueda manual)
CREATE INDEX IF NOT EXISTS idx_products_internal_code_active 
ON products(internal_code) 
WHERE deleted_at IS NULL;

-- Búsqueda de productos por nombre (búsqueda parcial)
CREATE INDEX IF NOT EXISTS idx_products_name_gin 
ON products USING gin(to_tsvector('spanish', name)) 
WHERE deleted_at IS NULL;

-- Alertas de stock bajo (consulta frecuente en dashboard)
CREATE INDEX IF NOT EXISTS idx_products_low_stock_alert 
ON products(current_stock, min_stock_alert, name) 
WHERE deleted_at IS NULL AND current_stock <= min_stock_alert;

-- Productos por categoría para catálogo
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_id, name) 
WHERE deleted_at IS NULL AND is_active = true;

-- Productos próximos a vencer (alertas de inventario)
CREATE INDEX IF NOT EXISTS idx_products_expiration_warning 
ON products(expiration_date, name) 
WHERE deleted_at IS NULL 
AND expiration_date IS NOT NULL 
AND expiration_date <= CURRENT_DATE + INTERVAL '7 days';

-- =====================================================
-- 2. ÍNDICES PARA VENTAS
-- =====================================================

-- Ventas por rango de fecha (reportes diarios/semanales/mensuales)
CREATE INDEX IF NOT EXISTS idx_sales_date_range 
ON sales(created_at DESC) 
WHERE deleted_at IS NULL;

-- Ventas por cliente (historial de compras)
CREATE INDEX IF NOT EXISTS idx_sales_customer_date 
ON sales(customer_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Ventas por caja y fecha (arqueo de caja)
CREATE INDEX IF NOT EXISTS idx_sales_cash_register_date 
ON sales(cash_register_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Ventas por vendedor (comisiones y estadísticas)
CREATE INDEX IF NOT EXISTS idx_sales_user_date 
ON sales(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Ventas por estado (pendientes por procesar)
CREATE INDEX IF NOT EXISTS idx_sales_status_pending 
ON sales(status, created_at) 
WHERE deleted_at IS NULL AND status IN ('PENDING', 'COMPLETED');

-- Ventas por moneda (reportes financieros multi-moneda)
CREATE INDEX IF NOT EXISTS idx_sales_currency_date 
ON sales(currency, created_at DESC) 
WHERE deleted_at IS NULL;

-- Items de venta por producto (movimientos de inventario)
CREATE INDEX IF NOT EXISTS idx_sale_items_product 
ON sale_items(product_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- =====================================================
-- 3. ÍNDICES PARA CRÉDITOS
-- =====================================================

-- Créditos por cliente (estado de cuenta)
CREATE INDEX IF NOT EXISTS idx_credits_customer_status 
ON credits(customer_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Créditos próximos a vencer (alertas de cobranza - 7 días)
CREATE INDEX IF NOT EXISTS idx_credits_due_soon 
ON credits(due_date, customer_id, status) 
WHERE deleted_at IS NULL 
AND status = 'PENDING' 
AND due_date <= CURRENT_DATE + INTERVAL '7 days';

-- Créditos vencidos (cobranza urgente)
CREATE INDEX IF NOT EXISTS idx_credits_overdue 
ON credits(due_date, balance DESC) 
WHERE deleted_at IS NULL 
AND status = 'OVERDUE';

-- Pagos de crédito por fecha (reportes de cobranza)
CREATE INDEX IF NOT EXISTS idx_credit_payments_date 
ON credit_payments(paid_at DESC) 
WHERE deleted_at IS NULL;

-- =====================================================
-- 4. ÍNDICES PARA CLIENTES
-- =====================================================

-- Búsqueda por cédula (validación rápida)
CREATE INDEX IF NOT EXISTS idx_customers_id_card 
ON customers(id_card) 
WHERE deleted_at IS NULL;

-- Búsqueda por teléfono (encontrar cliente en caja)
CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON customers(phone) 
WHERE deleted_at IS NULL;

-- Búsqueda por nombre (autocompletar)
CREATE INDEX IF NOT EXISTS idx_customers_name_gin 
ON customers USING gin(to_tsvector('spanish', first_name || ' ' || last_name)) 
WHERE deleted_at IS NULL;

-- Clientes con créditos activos
CREATE INDEX IF NOT EXISTS idx_customers_with_credits 
ON customers(id) 
WHERE deleted_at IS NULL 
AND EXISTS (SELECT 1 FROM credits c WHERE c.customer_id = customers.id AND c.status = 'PENDING' AND c.deleted_at IS NULL);

-- =====================================================
-- 5. ÍNDICES PARA COMPRAS
-- =====================================================

-- Compras por proveedor (historial)
CREATE INDEX IF NOT EXISTS idx_purchases_provider_date 
ON purchases(provider_id, purchase_date DESC) 
WHERE deleted_at IS NULL;

-- Compras por fecha de vencimiento de pago
CREATE INDEX IF NOT EXISTS idx_purchases_due_date 
ON purchases(due_date, status) 
WHERE deleted_at IS NULL 
AND due_date IS NOT NULL 
AND status IN ('PENDING', 'PARTIAL');

-- Items de compra por producto (trazabilidad)
CREATE INDEX IF NOT EXISTS idx_purchase_items_product 
ON purchase_items(product_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- =====================================================
-- 6. ÍNDICES PARA CATEGORÍAS
-- =====================================================

-- Categorías jerárquicas (padre/hijo)
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON categories(parent_id, name) 
WHERE deleted_at IS NULL AND is_active = true;

-- =====================================================
-- 7. ÍNDICES PARA SINCRONIZACIÓN OFFLINE-FIRST
-- =====================================================

-- Registros modificados desde fecha X (sync pull)
CREATE INDEX IF NOT EXISTS idx_products_sync_pull 
ON products(updated_at, version) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_sync_pull 
ON sales(updated_at, version) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_sync_pull 
ON customers(updated_at, version) 
WHERE deleted_at IS NULL;

-- Registros eliminados (soft delete para sync)
CREATE INDEX IF NOT EXISTS idx_products_deleted 
ON products(deleted_at, updated_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_deleted 
ON sales(deleted_at, updated_at) 
WHERE deleted_at IS NOT NULL;

-- =====================================================
-- 8. ÍNDICES COMPUESTOS PARA REPORTES
-- =====================================================

-- Top productos vendidos (dashboard)
CREATE INDEX IF NOT EXISTS idx_sale_items_top_products 
ON sale_items(product_id, quantity, created_at DESC) 
WHERE deleted_at IS NULL;

-- Ventas por hora (análisis de tráfico)
CREATE INDEX IF NOT EXISTS idx_sales_hourly 
ON sales(DATE_TRUNC('hour', created_at), total_amount) 
WHERE deleted_at IS NULL;

-- =====================================================
-- ESTADÍSTICAS DE ÍNDICES CREADOS
-- =====================================================

SELECT 'Índices de performance creados' as resultado, 
       COUNT(*) as total_indices 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
