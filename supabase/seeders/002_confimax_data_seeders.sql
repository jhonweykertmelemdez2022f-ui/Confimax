-- ============================================================================
-- CONFIMAX - SEEDERS DE PRODUCTOS, CLIENTES Y VENTAS
-- Ejecutar en la base de datos de Supabase PostgreSQL
-- ============================================================================

-- ---------------------------------------------------------
-- 0. LIMPIEZA PREVIA (Garantiza re-ejecución limpia)
-- ---------------------------------------------------------
-- Eliminar detalles y pagos asociados a nuestras órdenes de prueba
DELETE FROM sales.payments WHERE order_id IN (SELECT id FROM sales.orders WHERE order_number LIKE 'ORD-TEST-%');
DELETE FROM sales.order_items WHERE order_id IN (SELECT id FROM sales.orders WHERE order_number LIKE 'ORD-TEST-%');
DELETE FROM sales.orders WHERE order_number LIKE 'ORD-TEST-%';

-- Eliminar nuestros clientes de prueba
DELETE FROM customers.customers WHERE email IN (
  'contacto@panelsol.com', 
  'deliciaspastel@gmail.com', 
  'ventas@distlosandes.com', 
  'compras@superneon.com', 
  'logistica@alixpress.com'
);

-- Eliminar nuestros productos de prueba
DELETE FROM inventory.products WHERE sku IN (
  'CFX-HAR-001', 
  'CFX-AZU-001', 
  'CFX-ACE-001', 
  'CFX-MAN-001', 
  'CFX-LEV-001', 
  'CFX-SAL-001'
);

-- ---------------------------------------------------------
-- 1. INSERTAR CATEGORÍAS INVENTORY (Inserción condicional limpia sin índices únicos)
-- ---------------------------------------------------------
INSERT INTO inventory.categories (name, description)
SELECT val.name, val.description
FROM (VALUES
  ('Materia Prima', 'Insumos base para procesos de producción y distribución industrial'),
  ('Aceites y Grasas', 'Aceites de cocina refinados y grasas hidrogenadas vegetales'),
  ('Especies y Condimentos', 'Condimentos, conservantes e insumos de sazón alimenticios')
) AS val(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory.categories c WHERE c.name = val.name
);

-- ---------------------------------------------------------
-- 2. INSERTAR PRODUCTOS INDUSTRIALES
-- ---------------------------------------------------------
INSERT INTO inventory.products (sku, name, description, category_id, price, cost, is_active) VALUES 
(
  'CFX-HAR-001',
  'Harina de Trigo Especial 50kg', 
  'Harina panadera premium de alta fuerza para panaderías e industrias de consumo masivo', 
  (SELECT id FROM inventory.categories WHERE name = 'Materia Prima' LIMIT 1), 
  35.50, 24.00, true
),
(
  'CFX-AZU-001',
  'Azúcar Refinada Extra 50kg', 
  'Azúcar industrial blanca refinada de caña de alta pureza y grano fino', 
  (SELECT id FROM inventory.categories WHERE name = 'Materia Prima' LIMIT 1), 
  42.00, 31.50, true
),
(
  'CFX-ACE-001',
  'Aceite Girasol Refinado 20L', 
  'Aceite vegetal 100% puro de girasol en envase industrial sellado de alta resistencia', 
  (SELECT id FROM inventory.categories WHERE name = 'Aceites y Grasas' LIMIT 1), 
  38.00, 26.50, true
),
(
  'CFX-MAN-001',
  'Manteca Vegetal Repostería 15kg', 
  'Manteca vegetal hidrogenada especial para hojaldres, masas dulces y repostería fina', 
  (SELECT id FROM inventory.categories WHERE name = 'Aceites y Grasas' LIMIT 1), 
  28.90, 19.80, true
),
(
  'CFX-LEV-001',
  'Levadura Seca Activa 500g', 
  'Levadura seca instantánea de alto rendimiento y fermentación rápida en empaque al vacío', 
  (SELECT id FROM inventory.categories WHERE name = 'Especies y Condimentos' LIMIT 1), 
  4.50, 2.90, true
),
(
  'CFX-SAL-001',
  'Sal Marina Yodada 25kg', 
  'Sal industrial refinada y molida para procesos alimenticios y panificación', 
  (SELECT id FROM inventory.categories WHERE name = 'Especies y Condimentos' LIMIT 1), 
  8.20, 5.10, true
);

-- ---------------------------------------------------------
-- 3. INSERTAR CLIENTES (Empresas y Personas con RIF/Tax ID)
-- ---------------------------------------------------------
INSERT INTO customers.customers (email, name, phone, tax_id, notes, is_active) VALUES 
('contacto@panelsol.com', 'Panificadora El Sol, C.A.', '+58 212-5551234', 'J-12345678-9', 'Cliente VIP, despacho de materia prima', true),
('deliciaspastel@gmail.com', 'Pastelería La Delicia, F.P.', '+58 241-8889977', 'V-18765432-1', 'Cliente frecuente', true),
('ventas@distlosandes.com', 'Distribuidora Los Andes 2020, C.A.', '+58 274-2621122', 'J-31354678-2', 'Mayorista ropa y alimentos', true),
('compras@superneon.com', 'Supermercado Neon, C.A.', '+58 261-7776655', 'J-44332211-0', 'Compra semanal', true),
('logistica@alixpress.com', 'Corporación de Alimentos Express', '+58 251-4443322', 'J-50012345-6', 'Distribuidor regional', true);

-- ---------------------------------------------------------
-- 4. INSERTAR HISTORIAL DE VENTAS Y ITEMS DE VENTAS
-- ---------------------------------------------------------
DO $$
DECLARE
  v_user_id UUID;
  v_client1_id UUID;
  v_client2_id UUID;
  v_client3_id UUID;
  v_prod_harina_id UUID;
  v_prod_azucar_id UUID;
  v_prod_aceite_id UUID;
  v_prod_manteca_id UUID;
  v_order1_id UUID;
  v_order2_id UUID;
  v_order3_id UUID;
BEGIN
  -- Obtener el ID de un usuario disponible en public.profiles
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
  
  -- Obtener los IDs de los clientes insertados
  SELECT id INTO v_client1_id FROM customers.customers WHERE tax_id = 'J-12345678-9' LIMIT 1;
  SELECT id INTO v_client2_id FROM customers.customers WHERE tax_id = 'V-18765432-1' LIMIT 1;
  SELECT id INTO v_client3_id FROM customers.customers WHERE tax_id = 'J-31354678-2' LIMIT 1;
  
  -- Obtener los IDs de los productos insertados
  SELECT id INTO v_prod_harina_id FROM inventory.products WHERE sku = 'CFX-HAR-001' LIMIT 1;
  SELECT id INTO v_prod_azucar_id FROM inventory.products WHERE sku = 'CFX-AZU-001' LIMIT 1;
  SELECT id INTO v_prod_aceite_id FROM inventory.products WHERE sku = 'CFX-ACE-001' LIMIT 1;
  SELECT id INTO v_prod_manteca_id FROM inventory.products WHERE sku = 'CFX-MAN-001' LIMIT 1;

  -- Si no existen productos o clientes válidos, no continuar
  IF v_client1_id IS NULL OR v_prod_harina_id IS NULL THEN
    RAISE NOTICE 'No se pudieron recuperar los IDs necesarios para generar las ventas de prueba';
    RETURN;
  END IF;

  -- =========================================================
  -- VENTA 1: A Panificadora El Sol (10 sacos de harina)
  -- =========================================================
  INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, created_at)
  VALUES (
    'ORD-TEST-0001',
    v_client1_id, 
    v_user_id, 
    'delivered',
    355.00,  
    56.80,   -- IVA 16%
    0.00,
    411.80,  -- Total
    'Despacho de materia prima panadera. [SEED-TEST]',
    NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_order1_id;

  INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total)
  VALUES 
    (v_order1_id, v_prod_harina_id, 'CFX-HAR-001', 'Harina de Trigo Especial 50kg', 10, 35.50, 0.00, 355.00);

  INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, created_at)
  VALUES (v_order1_id, 'transfer', 411.80, 'USD', 'completed', 'TXN-P001', NOW() - INTERVAL '3 days');

  -- =========================================================
  -- VENTA 2: A Pastelería La Delicia (Azúcar y Manteca)
  -- =========================================================
  INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, created_at)
  VALUES (
    'ORD-TEST-0002',
    v_client2_id, 
    v_user_id, 
    'delivered',
    183.80,  
    29.41,   -- IVA 16%
    0.00,
    213.21,  
    'Insumos de pastelería mensual. [SEED-TEST]',
    NOW() - INTERVAL '2 days'
  ) RETURNING id INTO v_order2_id;

  INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total)
  VALUES 
    (v_order2_id, v_prod_azucar_id, 'CFX-AZU-001', 'Azúcar Refinada Extra 50kg', 3, 42.00, 0.00, 126.00),
    (v_order2_id, v_prod_manteca_id, 'CFX-MAN-001', 'Manteca Vegetal Repostería 15kg', 2, 28.90, 0.00, 57.80);

  INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, created_at)
  VALUES (v_order2_id, 'cash', 213.21, 'USD', 'completed', 'TXN-P002', NOW() - INTERVAL '2 days');

  -- =========================================================
  -- VENTA 3: A Distribuidora Los Andes (Compra de Aceite y Harina)
  -- =========================================================
  INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, created_at)
  VALUES (
    'ORD-TEST-0003',
    v_client3_id, 
    v_user_id, 
    'delivered',
    735.00,  
    117.60,  -- IVA 16%
    0.00,
    852.60,  
    'Venta al mayor para distribución regional. [SEED-TEST]',
    NOW() - INTERVAL '1 day'
  ) RETURNING id INTO v_order3_id;

  INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total)
  VALUES 
    (v_order3_id, v_prod_aceite_id, 'CFX-ACE-001', 'Aceite Girasol Refinado 20L', 10, 38.00, 0.00, 380.00),
    (v_order3_id, v_prod_harina_id, 'CFX-HAR-001', 'Harina de Trigo Especial 50kg', 10, 35.50, 0.00, 355.00);

  INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, created_at)
  VALUES (v_order3_id, 'card', 852.60, 'USD', 'completed', 'TXN-P003', NOW() - INTERVAL '1 day');

  -- Actualizar subtotales, IVA y totales calculados reales de los items
  UPDATE sales.orders s
  SET 
    subtotal = (SELECT COALESCE(SUM(total), 0) FROM sales.order_items WHERE order_id = s.id),
    tax = ROUND((SELECT COALESCE(SUM(total), 0) FROM sales.order_items WHERE order_id = s.id) * 0.16, 2),
    total = ROUND((SELECT COALESCE(SUM(total), 0) FROM sales.order_items WHERE order_id = s.id) * 1.16, 2)
  WHERE s.id IN (v_order1_id, v_order2_id, v_order3_id);

  RAISE NOTICE '¡Ventas de prueba generadas exitosamente!';
END $$;
