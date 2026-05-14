-- Seeder para Confimax
-- Insertar Categorías iniciales
INSERT INTO categories (name, description) VALUES 
('Materia Prima', 'Productos base para procesos industriales y ventas al mayor'),
('Aceites y Grasas', 'Aceites vegetales, industriales y grasas refinadas'),
('Especies y Condimentos', 'Insumos de sazón y conservación');

-- Insertar Productos de prueba técnica
-- Usamos subconsultas para obtener los IDs de las categorías recién creadas
INSERT INTO products (name, sku, barcode, description, category_id, unit_price, stock_quantity, expiration_date) VALUES 
(
    'Harina de Trigo Especial', 
    'CFX-HAR-001', 
    '7591234567890', 
    'Harina de alta pureza para uso industrial y panificación', 
    (SELECT id FROM categories WHERE name = 'Materia Prima'), 
    1.25, 
    450, 
    '2026-12-15'
),
(
    'Aceite Vegetal Refinado 1L', 
    'CFX-ACE-001', 
    '7599876543210', 
    'Aceite de girasol refinado con alto punto de humo', 
    (SELECT id FROM categories WHERE name = 'Aceites y Grasas'), 
    2.50, 
    120, 
    '2026-05-10'
),
(
    'Azúcar Refinada Extra', 
    'CFX-AZU-001', 
    '7594567890123', 
    'Azúcar blanca refinada de grano fino', 
    (SELECT id FROM categories WHERE name = 'Materia Prima'), 
    0.95, 
    1200, 
    '2027-01-10'
),
(
    'Sal Yodada Molida 1kg', 
    'CFX-SAL-001', 
    '7593210987654', 
    'Sal fina procesada con adición de yodo', 
    (SELECT id FROM categories WHERE name = 'Especies y Condimentos'), 
    0.40, 
    800, 
    '2028-03-15'
);
