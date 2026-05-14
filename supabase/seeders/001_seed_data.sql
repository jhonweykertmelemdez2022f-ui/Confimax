-- ============================================================================
-- CONFIMAX - SEEDERS / DATOS DE PRUEBA
-- Ejecutar después de crear el schema
-- ============================================================================

-- ============================================================================
-- 1. PROFILES - Usuarios del sistema
-- ============================================================================

INSERT INTO public.profiles (email, name, role, is_active, phone) VALUES
    ('admin@confimax.com', 'Administrador Sistema', 'admin', true, '+34 600 000 001'),
    ('manager@confimax.com', 'Gerente Ventas', 'manager', true, '+34 600 000 002'),
    ('juan.perez@confimax.com', 'Juan Pérez', 'user', true, '+34 600 000 003'),
    ('maria.garcia@confimax.com', 'María García', 'user', true, '+34 600 000 004'),
    ('carlos.lopez@confimax.com', 'Carlos López', 'user', true, '+34 600 000 005'),
    ('ana.martinez@confimax.com', 'Ana Martínez', 'user', false, '+34 600 000 006');

-- ============================================================================
-- 2. INVENTORY - Categorías (incluyendo las que ya existen)
-- ============================================================================

-- Categorías principales (ya insertadas en schema, verificamos)
-- Electrónica, Ropa, Alimentos, Hogar

-- Subcategorías Electrónica
INSERT INTO inventory.categories (name, description, parent_id) VALUES
    ('Smartphones', 'Teléfonos móviles inteligentes', (SELECT id FROM inventory.categories WHERE name = 'Electrónica')),
    ('Laptops', 'Portátiles y notebooks', (SELECT id FROM inventory.categories WHERE name = 'Electrónica')),
    ('Accesorios', 'Accesorios electrónicos', (SELECT id FROM inventory.categories WHERE name = 'Electrónica'));

-- Subcategorías Ropa
INSERT INTO inventory.categories (name, description, parent_id) VALUES
    ('Hombre', 'Ropa masculina', (SELECT id FROM inventory.categories WHERE name = 'Ropa')),
    ('Mujer', 'Ropa femenina', (SELECT id FROM inventory.categories WHERE name = 'Ropa')),
    ('Niños', 'Ropa infantil', (SELECT id FROM inventory.categories WHERE name = 'Ropa'));

-- Subcategorías Alimentos
INSERT INTO inventory.categories (name, description, parent_id) VALUES
    ('Frutas', 'Frutas frescas', (SELECT id FROM inventory.categories WHERE name = 'Alimentos')),
    ('Verduras', 'Verduras frescas', (SELECT id FROM inventory.categories WHERE name = 'Alimentos')),
    ('Lácteos', 'Productos lácteos', (SELECT id FROM inventory.categories WHERE name = 'Alimentos'));

-- Subcategorías Hogar
INSERT INTO inventory.categories (name, description, parent_id) VALUES
    ('Muebles', 'Muebles para el hogar', (SELECT id FROM inventory.categories WHERE name = 'Hogar')),
    ('Decoración', 'Artículos decorativos', (SELECT id FROM inventory.categories WHERE name = 'Hogar')),
    ('Cocina', 'Utensilios de cocina', (SELECT id FROM inventory.categories WHERE name = 'Hogar'));

-- ============================================================================
-- 3. INVENTORY - Productos
-- ============================================================================

INSERT INTO inventory.products (sku, name, description, category_id, price, cost, is_active) VALUES
    ('ELEC-001', 'iPhone 15 Pro', 'Smartphone Apple 128GB Titanio', (SELECT id FROM inventory.categories WHERE name = 'Smartphones'), 1199.00, 850.00, true),
    ('ELEC-002', 'Samsung Galaxy S24', 'Smartphone Android 256GB', (SELECT id FROM inventory.categories WHERE name = 'Smartphones'), 999.00, 700.00, true),
    ('ELEC-003', 'MacBook Air M3', 'Portátil Apple 13 pulgadas 256GB', (SELECT id FROM inventory.categories WHERE name = 'Laptops'), 1299.00, 950.00, true),
    ('ELEC-004', 'Dell XPS 13', 'Portátil Windows 13 pulgadas 512GB', (SELECT id FROM inventory.categories WHERE name = 'Laptops'), 1099.00, 800.00, true),
    ('ELEC-005', 'AirPods Pro 2', 'Auriculares inalámbricos con cancelación de ruido', (SELECT id FROM inventory.categories WHERE name = 'Accesorios'), 249.00, 150.00, true),
    ('ELEC-006', 'Cargador USB-C 65W', 'Cargador rápido universal', (SELECT id FROM inventory.categories WHERE name = 'Accesorios'), 35.00, 15.00, true),
    ('ROPA-001', 'Camisa Oxford Hombre', 'Camisa formal azul marino talla M', (SELECT id FROM inventory.categories WHERE name = 'Hombre'), 45.00, 20.00, true),
    ('ROPA-002', 'Jeans Slim Fit', 'Pantalones vaqueros azul oscuro', (SELECT id FROM inventory.categories WHERE name = 'Hombre'), 59.00, 25.00, true),
    ('ROPA-003', 'Vestido Verano Mujer', 'Vestido floral talla S', (SELECT id FROM inventory.categories WHERE name = 'Mujer'), 39.00, 15.00, true),
    ('ROPA-004', 'Blusa Elegante', 'Blusa seda blanca talla M', (SELECT id FROM inventory.categories WHERE name = 'Mujer'), 55.00, 22.00, true),
    ('ROPA-005', 'Camiseta Niño', 'Camiseta algodón estampada talla 8', (SELECT id FROM inventory.categories WHERE name = 'Niños'), 15.00, 5.00, true),
    ('ALIM-001', 'Manzanas Royal Gala', 'Bolsa 1kg manzanas frescas', (SELECT id FROM inventory.categories WHERE name = 'Frutas'), 2.50, 1.20, true),
    ('ALIM-002', 'Plátanos Canarios', 'Racimo plátanos 1kg', (SELECT id FROM inventory.categories WHERE name = 'Frutas'), 1.80, 0.80, true),
    ('ALIM-003', 'Tomates Cherry', 'Bandeja 500g tomates cherry', (SELECT id FROM inventory.categories WHERE name = 'Verduras'), 3.20, 1.50, true),
    ('ALIM-004', 'Lechuga Romana', 'Unidad lechuga fresca', (SELECT id FROM inventory.categories WHERE name = 'Verduras'), 1.50, 0.60, true),
    ('ALIM-005', 'Queso Manchego', 'Queso curado 250g', (SELECT id FROM inventory.categories WHERE name = 'Lácteos'), 8.50, 4.00, true),
    ('ALIM-006', 'Yogur Natural', 'Pack 4 yogures naturales', (SELECT id FROM inventory.categories WHERE name = 'Lácteos'), 2.80, 1.20, true),
    ('HOGAR-001', 'Sofá 3 Plazas', 'Sofá tela gris moderno', (SELECT id FROM inventory.categories WHERE name = 'Muebles'), 599.00, 350.00, true),
    ('HOGAR-002', 'Mesa Comedor', 'Mesa madera 6 personas', (SELECT id FROM inventory.categories WHERE name = 'Muebles'), 299.00, 150.00, true),
    ('HOGAR-003', 'Lámpara LED', 'Lámpara escritorio regulable', (SELECT id FROM inventory.categories WHERE name = 'Decoración'), 45.00, 18.00, true),
    ('HOGAR-004', 'Espejo Pared', 'Espejo decorativo 80x60cm', (SELECT id FROM inventory.categories WHERE name = 'Decoración'), 89.00, 35.00, true),
    ('HOGAR-005', 'Set Ollas Inducción', 'Set 3 ollas acero inoxidable', (SELECT id FROM inventory.categories WHERE name = 'Cocina'), 79.00, 30.00, true),
    ('HOGAR-006', 'Cafetera Express', 'Cafetera espresso manual', (SELECT id FROM inventory.categories WHERE name = 'Cocina'), 129.00, 55.00, true);

-- ============================================================================
-- 4. INVENTORY - Stock por ubicación
-- ============================================================================

INSERT INTO inventory.stock (product_id, location, quantity, min_quantity, max_quantity) VALUES
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'Almacén Central', 25, 10, 50),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'Tienda Principal', 8, 5, 20),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-002'), 'Almacén Central', 30, 10, 50),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-003'), 'Almacén Central', 12, 5, 20),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-004'), 'Almacén Central', 15, 5, 25),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-005'), 'Tienda Principal', 20, 10, 40),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-006'), 'Almacén Central', 100, 50, 200),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-001'), 'Tienda Principal', 15, 5, 30),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-002'), 'Tienda Principal', 20, 8, 40),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-003'), 'Tienda Principal', 12, 5, 25),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-004'), 'Tienda Principal', 10, 5, 20),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-005'), 'Tienda Principal', 25, 10, 50),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-001'), 'Frigorífico Central', 50, 20, 100),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-002'), 'Frigorífico Central', 40, 20, 80),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-003'), 'Frigorífico Central', 30, 15, 60),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-004'), 'Frigorífico Central', 60, 20, 100),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-005'), 'Cámara Frigorífica', 20, 10, 40),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-006'), 'Frigorífico Central', 40, 15, 80),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-001'), 'Almacén Central', 5, 2, 10),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-002'), 'Almacén Central', 8, 3, 15),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-003'), 'Tienda Principal', 15, 5, 30),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-004'), 'Tienda Principal', 10, 5, 20),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-005'), 'Almacén Central', 18, 8, 35),
    ((SELECT id FROM inventory.products WHERE sku = 'HOGAR-006'), 'Tienda Principal', 12, 5, 25);

-- ============================================================================
-- 5. INVENTORY - Movimientos de stock
-- ============================================================================

INSERT INTO inventory.stock_movements (product_id, location, quantity, movement_type, reference_type, notes, created_by) VALUES
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'Almacén Central', 50, 'in', 'initial_stock', 'Stock inicial', (SELECT id FROM public.profiles WHERE email = 'admin@confimax.com')),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'Almacén Central', -5, 'out', 'sale', 'Venta online #1001', (SELECT id FROM public.profiles WHERE email = 'manager@confimax.com')),
    ((SELECT id FROM inventory.products WHERE sku = 'ELEC-002'), 'Almacén Central', 40, 'in', 'initial_stock', 'Stock inicial', (SELECT id FROM public.profiles WHERE email = 'admin@confimax.com')),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-001'), 'Frigorífico Central', 100, 'in', 'purchase', 'Compra proveedor Frutas S.L.', (SELECT id FROM public.profiles WHERE email = 'manager@confimax.com')),
    ((SELECT id FROM inventory.products WHERE sku = 'ALIM-001'), 'Frigorífico Central', -20, 'out', 'sale', 'Pedido mayorista #2001', (SELECT id FROM public.profiles WHERE email = 'juan.perez@confimax.com')),
    ((SELECT id FROM inventory.products WHERE sku = 'ROPA-001'), 'Tienda Principal', 20, 'in', 'transfer', 'Transferencia desde Almacén Central', (SELECT id FROM public.profiles WHERE email = 'admin@confimax.com'));

-- ============================================================================
-- 6. CUSTOMERS - Clientes
-- ============================================================================

INSERT INTO customers.customers (email, name, phone, tax_id, notes, is_active) VALUES
    ('cliente1@email.com', 'Empresa ABC S.L.', '+34 911 000 001', 'B12345678', 'Cliente VIP, descuento 10%', true),
    ('cliente2@email.com', 'María Fernández', '+34 622 000 002', NULL, 'Cliente particular', true),
    ('cliente3@email.com', 'Tienda Moda Rápida', '+34 933 000 003', 'B87654321', 'Mayorista ropa', true),
    ('cliente4@email.com', 'Carlos Ruiz', '+34 644 000 004', NULL, 'Cliente frecuente', true),
    ('cliente5@email.com', 'Restaurante El Sabor', '+34 955 000 005', 'B11111111', 'Compra semanal alimentos', true),
    ('cliente6@email.com', 'Ana Torres', '+34 666 000 006', NULL, 'Nueva cliente', true),
    ('cliente7@email.com', 'Inmobiliaria Centro', '+34 977 000 007', 'B22222222', 'Compra mobiliario oficina', false),
    ('cliente8@email.com', 'Pedro Sánchez', '+34 688 000 008', NULL, 'Cliente ocasional', true);

-- ============================================================================
-- 7. CUSTOMERS - Direcciones
-- ============================================================================

INSERT INTO customers.addresses (customer_id, type, name, address_line1, city, postal_code, country, is_default) VALUES
    ((SELECT id FROM customers.customers WHERE email = 'cliente1@email.com'), 'both', 'Oficina Central', 'Calle Mayor 123, 4º', 'Madrid', '28001', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente1@email.com'), 'shipping', 'Almacén', 'Polígono Industrial Norte, Nave 5', 'Alcobendas', '28100', 'España', false),
    ((SELECT id FROM customers.customers WHERE email = 'cliente2@email.com'), 'shipping', 'Casa', 'Avenida Diagonal 456', 'Barcelona', '08006', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente2@email.com'), 'billing', 'Trabajo', 'Gran Vía 789, Oficina 12', 'Barcelona', '08010', 'España', false),
    ((SELECT id FROM customers.customers WHERE email = 'cliente3@email.com'), 'both', 'Tienda Principal', 'Calle Preciados 10', 'Madrid', '28013', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente4@email.com'), 'shipping', 'Domicilio', 'Calle Serrano 55, 2ºB', 'Madrid', '28006', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente5@email.com'), 'both', 'Restaurante', 'Plaza España 22', 'Sevilla', '41001', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente6@email.com'), 'shipping', 'Casa', 'Calle Uría 33, 3º', 'Oviedo', '33003', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente7@email.com'), 'both', 'Oficinas', 'Paseo de la Castellana 100', 'Madrid', '28046', 'España', true),
    ((SELECT id FROM customers.customers WHERE email = 'cliente8@email.com'), 'shipping', 'Domicilio', 'Calle Larios 8', 'Málaga', '29015', 'España', true);

-- ============================================================================
-- 8. SALES - Pedidos
-- ============================================================================

INSERT INTO sales.orders (order_number, customer_id, user_id, status, subtotal, tax, discount, total, notes, shipping_address_id, billing_address_id) VALUES
    ('ORD-2024-0001', (SELECT id FROM customers.customers WHERE email = 'cliente1@email.com'), (SELECT id FROM public.profiles WHERE email = 'juan.perez@confimax.com'), 'delivered', 1244.00, 124.40, 0, 1368.40, 'Pedido urgente', NULL, NULL),
    ('ORD-2024-0002', (SELECT id FROM customers.customers WHERE email = 'cliente2@email.com'), (SELECT id FROM public.profiles WHERE email = 'maria.garcia@confimax.com'), 'shipped', 294.00, 29.40, 10.00, 313.40, 'Regalo de cumpleaños', NULL, NULL),
    ('ORD-2024-0003', (SELECT id FROM customers.customers WHERE email = 'cliente3@email.com'), (SELECT id FROM public.profiles WHERE email = 'juan.perez@confimax.com'), 'processing', 599.00, 59.90, 0, 658.90, 'Mayorista - factura mensual', NULL, NULL),
    ('ORD-2024-0004', (SELECT id FROM customers.customers WHERE email = 'cliente4@email.com'), (SELECT id FROM public.profiles WHERE email = 'carlos.lopez@confimax.com'), 'pending', 1348.00, 134.80, 50.00, 1432.80, 'Esperando confirmación stock', NULL, NULL),
    ('ORD-2024-0005', (SELECT id FROM customers.customers WHERE email = 'cliente5@email.com'), (SELECT id FROM public.profiles WHERE email = 'maria.garcia@confimax.com'), 'confirmed', 24.60, 2.46, 0, 27.06, 'Entrega diaria habitual', NULL, NULL),
    ('ORD-2024-0006', (SELECT id FROM customers.customers WHERE email = 'cliente6@email.com'), (SELECT id FROM public.profiles WHERE email = 'juan.perez@confimax.com'), 'cancelled', 1199.00, 119.90, 0, 0, 'Cliente canceló - cambio de opinión', NULL, NULL),
    ('ORD-2024-0007', (SELECT id FROM customers.customers WHERE email = 'cliente8@email.com'), (SELECT id FROM public.profiles WHERE email = 'carlos.lopez@confimax.com'), 'delivered', 174.00, 17.40, 0, 191.40, NULL, NULL),
    ('ORD-2024-0008', (SELECT id FROM customers.customers WHERE email = 'cliente1@email.com'), (SELECT id FROM public.profiles WHERE email = 'juan.perez@confimax.com'), 'pending', 35.00, 3.50, 0, 38.50, 'Repuesto cargador', NULL, NULL);

-- ============================================================================
-- 9. SALES - Líneas de pedido
-- ============================================================================

INSERT INTO sales.order_items (order_id, product_id, sku, product_name, quantity, unit_price, discount, total) VALUES
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0001'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'ELEC-001', 'iPhone 15 Pro', 1, 1199.00, 0, 1199.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0001'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-006'), 'ELEC-006', 'Cargador USB-C 65W', 1, 35.00, 0, 35.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0001'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-005'), 'ELEC-005', 'AirPods Pro 2', 1, 249.00, 239.00, 10.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-003'), 'ROPA-003', 'Vestido Verano Mujer', 2, 39.00, 0, 78.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-004'), 'ROPA-004', 'Blusa Elegante', 1, 55.00, 0, 55.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-002'), 'ROPA-002', 'Jeans Slim Fit', 1, 59.00, 0, 59.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), (SELECT id FROM inventory.products WHERE sku = 'ALIM-005'), 'ALIM-005', 'Queso Manchego', 1, 8.50, 0, 8.50),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), (SELECT id FROM inventory.products WHERE sku = 'ALIM-006'), 'ALIM-006', 'Yogur Natural', 2, 2.80, 0, 5.60),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0003'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-001'), 'ROPA-001', 'Camisa Oxford Hombre', 5, 45.00, 0, 225.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0003'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-002'), 'ROPA-002', 'Jeans Slim Fit', 5, 59.00, 0, 295.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0003'), (SELECT id FROM inventory.products WHERE sku = 'ROPA-005'), 'ROPA-005', 'Camiseta Niño', 5, 15.00, 0, 75.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0004'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-003'), 'ELEC-003', 'MacBook Air M3', 1, 1299.00, 0, 1299.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0004'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-005'), 'ELEC-005', 'AirPods Pro 2', 1, 249.00, 0, 249.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0005'), (SELECT id FROM inventory.products WHERE sku = 'ALIM-001'), 'ALIM-001', 'Manzanas Royal Gala', 5, 2.50, 0, 12.50),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0005'), (SELECT id FROM inventory.products WHERE sku = 'ALIM-003'), 'ALIM-003', 'Tomates Cherry', 3, 3.20, 0, 9.60),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0005'), (SELECT id FROM inventory.products WHERE sku = 'ALIM-002'), 'ALIM-002', 'Plátanos Canarios', 2, 1.80, 0, 3.60),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0006'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-001'), 'ELEC-001', 'iPhone 15 Pro', 1, 1199.00, 0, 1199.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0007'), (SELECT id FROM inventory.products WHERE sku = 'HOGAR-003'), 'HOGAR-003', 'Lámpara LED', 2, 45.00, 0, 90.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0007'), (SELECT id FROM inventory.products WHERE sku = 'HOGAR-004'), 'HOGAR-004', 'Espejo Pared', 1, 89.00, 0, 89.00),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0008'), (SELECT id FROM inventory.products WHERE sku = 'ELEC-006'), 'ELEC-006', 'Cargador USB-C 65W', 1, 35.00, 0, 35.00);

-- ============================================================================
-- 10. SALES - Pagos
-- ============================================================================

INSERT INTO sales.payments (order_id, payment_method, amount, currency, status, transaction_id, metadata) VALUES
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0001'), 'card', 1368.40, 'EUR', 'completed', 'txn_visa_12345', '{"card_last4": "4242", "brand": "visa"}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0002'), 'paypal', 313.40, 'EUR', 'completed', 'txn_paypal_67890', '{"paypal_email": "cliente2@email.com"}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0003'), 'transfer', 658.90, 'EUR', 'pending', NULL, '{"bank": "Santander", "terms": "30 días"}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0004'), 'card', 1432.80, 'EUR', 'pending', NULL, '{"3d_secure": true}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0005'), 'cash', 27.06, 'EUR', 'completed', 'txn_cash_111', '{"delivery_note": "Entregado"}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0006'), 'card', 0, 'EUR', 'refunded', 'txn_refund_999', '{"reason": "Customer cancellation", "refund_amount": 0}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0007'), 'card', 191.40, 'EUR', 'completed', 'txn_visa_222', '{"card_last4": "1234", "brand": "mastercard"}'),
    ((SELECT id FROM sales.orders WHERE order_number = 'ORD-2024-0008'), 'card', 38.50, 'EUR', 'completed', 'txn_visa_333', '{"card_last4": "5555"}');

-- ============================================================================
-- FIN SEEDERS
-- ============================================================================
