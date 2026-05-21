-- ============================================================================
-- CONFIMAX - SEEDER DE PRUEBA PARA PAGINACIÓN
-- Crea 25+ clientes, 25+ productos y 25+ ventas para probar la paginación
-- ============================================================================

-- ---------------------------------------------------------
-- 0. LIMPIEZA PREVIA
-- ---------------------------------------------------------
DELETE FROM sales.payments WHERE order_id IN (SELECT id FROM sales.orders WHERE order_number LIKE 'ORD-PAG-%');
DELETE FROM sales.order_items WHERE order_id IN (SELECT id FROM sales.orders WHERE order_number LIKE 'ORD-PAG-%');
DELETE FROM sales.orders WHERE order_number LIKE 'ORD-PAG-%';
DELETE FROM customers.customers WHERE email LIKE 'pag-test%';
DELETE FROM inventory.products WHERE sku LIKE 'PAG-%';

-- ---------------------------------------------------------
-- 1. INSERTAR 25 CLIENTES DE PRUEBA
-- ---------------------------------------------------------
INSERT INTO customers.customers (email, name, phone, tax_id, notes, is_active) VALUES
-- Clientes 1-10
('pag-test-01@empresa.com', 'Distribuidora Los Robles, C.A.', '+58 212-1110001', 'J-00000001-1', 'Cliente para pruebas de paginación', true),
('pag-test-02@empresa.com', 'Comercializadora La Estrella, C.A.', '+58 212-1110002', 'J-00000002-2', 'Cliente para pruebas de paginación', true),
('pag-test-03@empresa.com', 'Supermercado El Valle, C.A.', '+58 212-1110003', 'J-00000003-3', 'Cliente para pruebas de paginación', true),
('pag-test-04@empresa.com', 'Panadería Los Amigos, F.P.', '+58 212-1110004', 'V-00000004-4', 'Cliente para pruebas de paginación', true),
('pag-test-05@empresa.com', 'Pastelería Dulces y Más, F.P.', '+58 212-1110005', 'V-00000005-5', 'Cliente para pruebas de paginación', true),
('pag-test-06@empresa.com', 'Distribuidora Oriental, C.A.', '+58 212-1110006', 'J-00000006-6', 'Cliente para pruebas de paginación', true),
('pag-test-07@empresa.com', 'Comercial El Norte, C.A.', '+58 212-1110007', 'J-00000007-7', 'Cliente para pruebas de paginación', true),
('pag-test-08@empresa.com', 'Supermercado La Fuente, C.A.', '+58 212-1110008', 'J-00000008-8', 'Cliente para pruebas de paginación', true),
('pag-test-09@empresa.com', 'Panadería La Victoria, F.P.', '+58 212-1110009', 'V-00000009-9', 'Cliente para pruebas de paginación', true),
('pag-test-10@empresa.com', 'Pastelería El Hogar, F.P.', '+58 212-1110010', 'V-00000010-0', 'Cliente para pruebas de paginación', true),
-- Clientes 11-20
('pag-test-11@empresa.com', 'Distribuidora El Centro, C.A.', '+58 212-1110011', 'J-00000011-1', 'Cliente para pruebas de paginación', true),
('pag-test-12@empresa.com', 'Comercializadora Sur, C.A.', '+58 212-1110012', 'J-00000012-2', 'Cliente para pruebas de paginación', true),
('pag-test-13@empresa.com', 'Supermercado El Sol, C.A.', '+58 212-1110013', 'J-00000013-3', 'Cliente para pruebas de paginación', true),
('pag-test-14@empresa.com', 'Panadería La Luna, F.P.', '+58 212-1110014', 'V-00000014-4', 'Cliente para pruebas de paginación', true),
('pag-test-15@empresa.com', 'Pastelería Las Flores, F.P.', '+58 212-1110015', 'V-00000015-5', 'Cliente para pruebas de paginación', true),
('pag-test-16@empresa.com', 'Distribuidora Marítima, C.A.', '+58 212-1110016', 'J-00000016-6', 'Cliente para pruebas de paginación', true),
('pag-test-17@empresa.com', 'Comercial El Oeste, C.A.', '+58 212-1110017', 'J-00000017-7', 'Cliente para pruebas de paginación', true),
('pag-test-18@empresa.com', 'Supermercado Central, C.A.', '+58 212-1110018', 'J-00000018-8', 'Cliente para pruebas de paginación', true),
('pag-test-19@empresa.com', 'Panadería El Pane, F.P.', '+58 212-1110019', 'V-00000019-9', 'Cliente para pruebas de paginación', true),
('pag-test-20@empresa.com', 'Pastelería El Carmen, F.P.', '+58 212-1110020', 'V-00000020-0', 'Cliente para pruebas de paginación', true),
-- Clientes 21-25
('pag-test-21@empresa.com', 'Distribuidora Los Andes, C.A.', '+58 212-1110021', 'J-00000021-1', 'Cliente para pruebas de paginación', true),
('pag-test-22@empresa.com', 'Comercializadora La Rápida, C.A.', '+58 212-1110022', 'J-00000022-2', 'Cliente para pruebas de paginación', true),
('pag-test-23@empresa.com', 'Supermercado La Esperanza, C.A.', '+58 212-1110023', 'J-00000023-3', 'Cliente para pruebas de paginación', true),
('pag-test-24@empresa.com', 'Panadería El Hogar, F.P.', '+58 212-1110024', 'V-00000024-4', 'Cliente para pruebas de paginación', true),
('pag-test-25@empresa.com', 'Pastelería El Buen Sabor, F.P.', '+58 212-1110025', 'V-00000025-5', 'Cliente para pruebas de paginación', true);

-- ---------------------------------------------------------
-- 2. INSERTAR 25 PRODUCTOS DE PRUEBA
-- ---------------------------------------------------------
INSERT INTO inventory.products (sku, name, description, category_id, price, cost, is_active)
SELECT 
  val.sku, 
  val.name, 
  val.description, 
  (SELECT id FROM inventory.categories WHERE name = 'Materia Prima' LIMIT 1), 
  val.price, 
  val.cost, 
  true
FROM (VALUES
-- Productos 1-10
('PAG-HAR-001', 'Harina de Trigo Premium 25kg', 'Harina panadera premium de alta fuerza para panaderías', 25.50, 18.00),
('PAG-AZU-001', 'Azúcar Morena 25kg', 'Azúcar morena integral de caña para repostería', 28.00, 20.00),
('PAG-ACE-001', 'Aceite de Maíz 20L', 'Aceite vegetal 100% puro de maíz en envase industrial', 42.00, 30.00),
('PAG-MAN-001', 'Manteca Vegetal 10kg', 'Manteca vegetal hidrogenada para repostería', 35.00, 24.00),
('PAG-LEV-001', 'Levadura Instantánea 1kg', 'Levadura seca instantánea de alto rendimiento', 12.00, 8.00),
('PAG-SAL-001', 'Sal Marina 25kg', 'Sal marina refinada para panificación', 15.00, 9.00),
('PAG-CHO-001', 'Cacao en Polvo 5kg', 'Cacao en polvo sin azúcar para repostería', 45.00, 32.00),
('PAG-HUE-001', 'Huevos Grandes (30u)', 'Huevos frescos grado A para pastelería', 8.00, 5.00),
('PAG-LEC-001', 'Leche Entera 1L', 'Leche entera pasteurizada para bebidas', 2.50, 1.50),
('PAG-MIE-001', 'Miel de Abeja 1kg', 'Miel natural de abejas para endulzar', 18.00, 12.00),
-- Productos 11-20
('PAG-ARO-001', 'Avena en Hojuelas 1kg', 'Avena natural en hojuelas para cereales', 6.00, 4.00),
('PAG-YOG-001', 'Yogurt Natural 1L', 'Yogurt natural sin azúcar para postres', 3.50, 2.00),
('PAG-CAN-001', 'Canela en Polvo 500g', 'Canela molida para repostería', 10.00, 6.00),
('PAG-VAI-001', 'Vainilla Extracto 500ml', 'Extracto de vainilla natural para repostería', 25.00, 18.00),
('PAG-NUE-001', 'Nueces Peladas 1kg', 'Nueces peladas para pasteles', 55.00, 40.00),
('PAG-ALM-001', 'Almendras 1kg', 'Almendras peladas para repostería', 65.00, 48.00),
('PAG-PAS-001', 'Pasas 1kg', 'Pasas rubias para pasteles', 12.00, 8.00),
('PAG-CIR-001', 'Ciruelas Secas 1kg', 'Ciruelas secas para repostería', 18.00, 12.00),
('PAG-FRE-001', 'Fresa Congelada 1kg', 'Fresas congeladas para postres', 15.00, 10.00),
('PAG-MOR-001', 'Mora Congelada 1kg', 'Moras congeladas para smoothies', 16.00, 11.00),
-- Productos 21-25
('PAG-CHOCOLATE-001', 'Chocolate Negro 70% 1kg', 'Chocolate negro para cobertura', 48.00, 35.00),
('PAG-CHOBLANCO-001', 'Chocolate Blanco 1kg', 'Chocolate blanco para repostería', 42.00, 30.00),
('PAG-MANTEQUILLA-001', 'Mantequilla Sin Sal 1kg', 'Mantequilla para pastelería', 22.00, 16.00),
('PAG-AZUCARGLASS-001', 'Azúcar Glass 1kg', 'Azúcar glass para glaseados', 14.00, 10.00),
('PAG-CHOCOLATELECHE-001', 'Chocolate con Leche 1kg', 'Chocolate con leche para postres', 40.00, 28.00)
) AS val(sku, name, description, price, cost)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory.products p WHERE p.sku = val.sku
);

-- ---------------------------------------------------------
-- 3. INSERTAR 25 VENTAS DE PRUEBA (Versión Simplificada)
-- ---------------------------------------------------------
INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, created_at)
SELECT 
  'ORD-PAG-' || lpad(i::TEXT, 4, '0'),
  (SELECT id FROM customers.customers WHERE email = 'pag-test-' || lpad((1 + (i % 25))::TEXT, 2, '0') || '@empresa.com' LIMIT 1),
  (SELECT id FROM public.profiles LIMIT 1),
  CASE WHEN i % 4 = 0 THEN 'pending' WHEN i % 4 = 1 THEN 'processing' WHEN i % 4 = 2 THEN 'shipped' ELSE 'delivered' END,
  (100 + (i * 10)),
  ROUND((100 + (i * 10)) * 0.16, 2),
  0,
  ROUND((100 + (i * 10)) * 1.16, 2),
  'Venta de prueba para paginación [SEED-PAG]',
  NOW() - (i || ' hours'::INTERVAL)
FROM generate_series(1, 25) AS i;

-- ---------------------------------------------------------
-- 4. INSERTAR PAGOS PARA LAS VENTAS
-- ---------------------------------------------------------
INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, created_at)
SELECT 
  o.id,
  CASE WHEN o.id % 3 = 0 THEN 'cash' WHEN o.id % 3 = 1 THEN 'card' ELSE 'transfer' END,
  o.total,
  'USD',
  'completed',
  'TXN-PAG-' || lpad(o.id::TEXT, 4, '0'),
  o.created_at
FROM sales.orders o WHERE o.order_number LIKE 'ORD-PAG-%';

-- ---------------------------------------------------------
-- 5. INSERTAR ALGUNOS ÍTEMS DE ORDEN (opcional)
-- ---------------------------------------------------------
INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total)
SELECT 
  o.id,
  (SELECT id FROM inventory.products WHERE sku = 'PAG-HAR-001' LIMIT 1),
  'PAG-HAR-001',
  'Harina de Trigo Premium 25kg',
  2,
  25.50,
  0,
  51.00
FROM sales.orders o WHERE o.order_number LIKE 'ORD-PAG-%' AND o.id % 2 = 0;

SELECT '¡Se generaron exitosamente 25 clientes, 25 productos y 25 ventas de prueba para paginación!' AS status;
