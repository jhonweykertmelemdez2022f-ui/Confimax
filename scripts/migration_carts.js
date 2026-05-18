const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar .env de la raíz
let databaseUrl = '';
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key === 'DATABASE_URL') {
            databaseUrl = val;
          }
          process.env[key] = val;
        }
      }
    });
    console.log('✅ Configuración cargada desde el .env de la raíz');
  }
} catch (err) {
  console.log('⚠️ Error al leer el archivo .env:', err.message);
}

const defaultUrl = 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres';
const finalUrl = databaseUrl || defaultUrl;

// Extraer credenciales usando URL
let user = 'postgres';
let password = 'Jackwell2019*2424';
let host = 'db.tlrliqbgtdplwdvbxqxv.supabase.co';
let port = '5432';
let database = 'postgres';

try {
  const parsed = new URL(finalUrl);
  user = parsed.username || user;
  password = parsed.password || password;
  host = parsed.hostname || host;
  port = parsed.port || port;
  database = parsed.pathname.substring(1) || database;
} catch (e) {
  console.log('⚠️ URL parsing falló, usando defaults de conexión');
}

const client = new Client({
  user,
  password,
  host,
  port: parseInt(port, 10),
  database,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('🔗 Conectado a Supabase PostgreSQL...');

    // Asegurar esquemas
    await client.query('CREATE SCHEMA IF NOT EXISTS sales;');
    await client.query('CREATE SCHEMA IF NOT EXISTS inventory;');

    // 1. Crear tabla: sales.carts (carritos)
    console.log('🛒 Creando tabla sales.carts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_cart UNIQUE(user_id)
      );
    `);

    // 2. Crear tabla: sales.cart_items (ítems de carritos)
    console.log('📦 Creando tabla sales.cart_items...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES sales.carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES inventory.products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_cart_product UNIQUE(cart_id, product_id)
      );
    `);

    // Asegurar triggers para updated_at en las nuevas tablas
    await client.query(`
      DROP TRIGGER IF EXISTS update_carts_updated_at ON sales.carts;
      CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON sales.carts 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      DROP TRIGGER IF EXISTS update_cart_items_updated_at ON sales.cart_items;
      CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON sales.cart_items 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `);
    console.log('✅ Tablas de carritos creadas con éxito.');

    // 3. Asegurar columna stock_quantity y producto de Harina con stock = 10 para la prueba
    console.log('🌾 Ajustando stock de Harina a 10 unidades para la simulación...');
    
    // Asegurar que la columna stock_quantity existe en la tabla products
    await client.query(`
      ALTER TABLE inventory.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0);
    `);

    // Buscar si existe el producto Harina (sku: CFX-HAR-001)
    const productResult = await client.query("SELECT * FROM inventory.products WHERE sku = 'CFX-HAR-001'");
    if (productResult.rows.length === 0) {
      console.log('➕ Creando producto Harina (CFX-HAR-001) ya que no existía...');
      await client.query(`
        INSERT INTO inventory.products (sku, name, description, price, cost, stock_quantity, is_active)
        VALUES ('CFX-HAR-001', 'Harina de Trigo Especial 50kg', 'Harina panadera premium de alta fuerza para panaderías', 35.50, 24.00, 10, true)
      `);
    } else {
      console.log('✏️ Actualizando stock de Harina existente a 10 unidades...');
      await client.query("UPDATE inventory.products SET stock_quantity = 10 WHERE sku = 'CFX-HAR-001'");
    }

    console.log('🎉 Migración y preparación completada exitosamente.');
  } catch (err) {
    console.error('❌ Error ejecutando la migración:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

runMigration();
