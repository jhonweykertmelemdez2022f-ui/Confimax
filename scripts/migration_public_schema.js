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
    console.log('🔗 Conectado a Supabase PostgreSQL en esquema public...');

    // 1. Asegurar extensión uuid-ossp y función de trigger
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 2. Crear Tabla public.categories
    console.log('📦 Creando tabla public.categories...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES public.categories(id),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Crear Tabla public.products
    console.log('📦 Creando tabla public.products...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(50) UNIQUE,
        description TEXT,
        category_id UUID REFERENCES public.categories(id),
        weight_class VARCHAR(20),
        expiration_class VARCHAR(20),
        size_class VARCHAR(20),
        unit_price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2),
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        min_stock_level INTEGER NOT NULL DEFAULT 10,
        expiration_date DATE,
        image_url VARCHAR(500),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Triggers de productos
    await client.query(`
      DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `);

    // 4. Crear Tabla public.customers
    console.log('👥 Creando tabla public.customers...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        rif VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        credit_limit DECIMAL(10, 2) NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Crear Tabla public.credits
    console.log('💳 Creando tabla public.credits...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.credits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES public.customers(id),
        sale_id UUID,
        amount DECIMAL(10, 2) NOT NULL,
        balance DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'VES',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        payment_due_date DATE,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Crear Tabla public.sales
    console.log('💰 Creando tabla public.sales...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.sales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES public.customers(id),
        vendor_id UUID REFERENCES public.users(id),
        subtotal DECIMAL(10, 2) NOT NULL,
        iva DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Nueva columna para descuentos
        total DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'VES',
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Crear Tabla public.sale_items
    console.log('📦 Creando tabla public.sale_items...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.sale_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
        product_id UUID REFERENCES public.products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Triggers de ventas
    await client.query(`
      DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
      CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `);

    // 8. Crear Tablas de Carritos en public
    console.log('🛒 Creando tabla public.carts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_cart_public UNIQUE(user_id)
      );
    `);

    console.log('📦 Creando tabla public.cart_items...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_cart_product_public UNIQUE(cart_id, product_id)
      );
    `);

    // Triggers de carritos
    await client.query(`
      DROP TRIGGER IF EXISTS update_carts_updated_at_public ON public.carts;
      CREATE TRIGGER update_carts_updated_at_public BEFORE UPDATE ON public.carts 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      DROP TRIGGER IF EXISTS update_cart_items_updated_at_public ON public.cart_items;
      CREATE TRIGGER update_cart_items_updated_at_public BEFORE UPDATE ON public.cart_items 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `);

    console.log('✅ Estructura del esquema public creada exitosamente.');

    // 9. Seeding inicial de datos en el esquema public
    console.log('🌾 Insertando datos de Harina en public.products...');
    
    // Categoría Harinas
    const catRes = await client.query("INSERT INTO public.categories (name, description) VALUES ('Harinas', 'Alimentos panaderos') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id;");
    const categoryId = catRes.rows[0].id;

    // Producto Harina con stock = 10 y unit_price
    const prodRes = await client.query("SELECT id FROM public.products WHERE sku = 'CFX-HAR-001'");
    if (prodRes.rows.length === 0) {
      console.log('➕ Creando Harina en public.products...');
      await client.query(`
        INSERT INTO public.products (sku, name, description, category_id, unit_price, cost_price, stock_quantity, min_stock_level, active)
        VALUES ('CFX-HAR-001', 'Harina de Trigo Especial 50kg', 'Harina panadera premium de alta fuerza para panaderías', $1, 35.50, 24.00, 10, 5, true)
      `, [categoryId]);
    } else {
      console.log('✏️ Reseteando stock de Harina en public.products a 10 unidades...');
      await client.query("UPDATE public.products SET stock_quantity = 10 WHERE sku = 'CFX-HAR-001'");
    }

    // Cliente para las ventas
    console.log('👥 Creando cliente de prueba en public.customers...');
    await client.query(`
      INSERT INTO public.customers (name, rif, email, phone, address, credit_limit)
      VALUES ('Cliente Ficticio S.A.', 'J-12345678-9', 'cliente.prueba@confimax.com', '0414-1234567', 'Av. Intercomunal Barquisimeto', 500.00)
      ON CONFLICT (rif) DO NOTHING;
    `);

    console.log('🎉 Migración de public schema completada con éxito.');
  } catch (err) {
    console.error('❌ Error ejecutando la migración del esquema public:', err.stack);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

runMigration();
