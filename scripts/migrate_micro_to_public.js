const fs = require('fs');
const path = require('path');

// 1. Manual parsing of the .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*["']?(.*?)["']?\s*$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const databaseUrl = env.DATABASE_URL;
console.log('Target database URL:', databaseUrl);

// 2. Load pg from the backend node_modules
const pgPath = path.join(__dirname, '../services/backend/node_modules/pg');
const { Pool } = require(pgPath);

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();

  try {
    console.log('\n--- Starting Microservices -> Public Schema Migration (Clean Slate) ---');

    await client.query('BEGIN');

    // 0. Clear target monolithic public tables
    console.log('Clearing old public tables...');
    await client.query('TRUNCATE public.sale_items CASCADE');
    await client.query('TRUNCATE public.sales CASCADE');
    await client.query('TRUNCATE public.customers CASCADE');
    await client.query('TRUNCATE public.products CASCADE');
    await client.query('TRUNCATE public.categories CASCADE');
    console.log('✓ Old public tables cleared.');

    // 1. Migrate Categories
    console.log('Migrating categories...');
    await client.query(`
      INSERT INTO public.categories (id, name, description, parent_id, active, created_at, updated_at)
      SELECT 
        id, 
        name, 
        description, 
        parent_id, 
        true as active,
        COALESCE(created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM inventory.categories;
    `);
    console.log('✓ Categories migrated.');

    // 2. Migrate Products
    console.log('Migrating products...');
    await client.query(`
      INSERT INTO public.products (id, name, sku, barcode, description, category_id, unit_price, cost_price, stock_quantity, min_stock_level, expiration_date, image_url, active, created_at, updated_at)
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        null as barcode, 
        p.description, 
        p.category_id, 
        p.price as unit_price, 
        p.cost as cost_price, 
        COALESCE((SELECT SUM(quantity) FROM inventory.stock WHERE product_id = p.id), 0) as stock_quantity,
        COALESCE((SELECT MIN(min_quantity) FROM inventory.stock WHERE product_id = p.id), 10) as min_stock_level,
        null as expiration_date,
        null as image_url,
        p.is_active as active,
        COALESCE(p.created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM inventory.products p;
    `);
    console.log('✓ Products migrated.');

    // 2.5 Seed stock levels if they are 0
    console.log('Seeding stock levels for newly migrated products...');
    await client.query(`
      UPDATE public.products 
      SET stock_quantity = 100 
      WHERE stock_quantity = 0;
    `);
    console.log('✓ Stock levels seeded.');

    // 3. Migrate Customers
    console.log('Migrating customers...');
    await client.query(`
      INSERT INTO public.customers (id, name, rif, email, phone, address, credit_limit, active, created_at, updated_at)
      SELECT 
        c.id, 
        c.name, 
        COALESCE(c.tax_id, 'V-00000000-0') as rif, 
        c.email, 
        c.phone, 
        COALESCE((SELECT address_line1 || ', ' || city FROM customers.addresses WHERE customer_id = c.id LIMIT 1), 'Desconocida') as address,
        1000.00 as credit_limit,
        c.is_active as active,
        COALESCE(c.created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM customers.customers c;
    `);
    console.log('✓ Customers migrated.');

    // 4. Migrate Sales (orders)
    console.log('Migrating sales...');
    await client.query(`
      INSERT INTO public.sales (id, customer_id, vendor_id, subtotal, iva, total, currency, status, notes, created_at, updated_at)
      SELECT 
        o.id, 
        o.customer_id, 
        COALESCE(
          (SELECT id FROM public.users WHERE id = o.user_id),
          (SELECT id FROM public.users LIMIT 1)
        ) as vendor_id, 
        o.subtotal, 
        o.tax as iva, 
        o.total, 
        'USD' as currency,
        o.status, 
        o.notes,
        COALESCE(o.created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM sales.orders o;
    `);
    console.log('✓ Sales migrated.');

    // 5. Migrate Sale Items (order items)
    console.log('Migrating sale items...');
    await client.query(`
      INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price, total, created_at)
      SELECT 
        id, 
        order_id as sale_id, 
        product_id, 
        quantity, 
        unit_price, 
        total,
        COALESCE(created_at, NOW()) as created_at
      FROM sales.order_items;
    `);
    console.log('✓ Sale items migrated.');

    await client.query('COMMIT');
    console.log('\n--- Clean Slate Migration Finished Successfully! ---');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed and rolled back:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
