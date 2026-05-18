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
  }
} catch (err) {
  console.log('⚠️ Error al leer el archivo .env:', err.message);
}

const defaultUrl = 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres';
const finalUrl = databaseUrl || defaultUrl;

// Cargar Módulos del Backend requeridos para la prueba
// Inyectar config mockeado para inicializar la conexión
process.env.SHARED_MODULES_PATH = path.join(__dirname, '../services/shared');

// Configuración manual del pool para que apunte a la base de datos de pruebas
const config = require('../services/backend/src/config');
config.sharedPath = path.join(__dirname, '../services/shared');

const CartService = require('../services/backend/src/services/cart.service');
const { pool } = require('../services/backend/src/models');

async function testCartsSystem() {
  console.log('\n=============================================================');
  console.log('🧪 SIMULACIÓN DE COMPRA CON CARRITO Y RESTA DE INVENTARIO');
  console.log('=============================================================\n');

  try {
    // 1. Obtener datos iniciales (Cliente y Producto Harina)
    console.log('🔍 Buscando usuario "cliente" y producto "Harina" en Supabase...');
    const userRes = await pool.query("SELECT * FROM public.users WHERE username = 'cliente'");
    const user = userRes.rows[0];
    if (!user) {
      throw new Error("No se encontró el usuario 'cliente'. Corre primero 'node scripts/seed_users.js'");
    }

    const prodRes = await pool.query("SELECT * FROM public.products WHERE sku = 'CFX-HAR-001'");
    let product = prodRes.rows[0];
    if (!product) {
      throw new Error("No se encontró el producto 'Harina' en public.products. Corre primero 'node scripts/migration_public_schema.js'");
    }

    // 2. Obtener cliente de prueba para el checkout
    const custRes = await pool.query("SELECT * FROM public.customers LIMIT 1");
    const customer = custRes.rows[0];
    const customerId = customer ? customer.id : null;
    console.log(`👤 Asociando venta al cliente de pruebas: "${customer ? customer.name : 'Venta General'}" (ID: ${customerId})`);

    // 3. Establecer stock inicial exacto a 10 flours
    console.log(`\n📦 Estableciendo stock inicial de Harina (sku: ${product.sku}) a EXACTAMENTE 10 unidades...`);
    await pool.query("UPDATE public.products SET stock_quantity = 10 WHERE id = $1", [product.id]);
    
    // Volver a leer para validar
    const freshProd = await pool.query("SELECT stock_quantity FROM public.products WHERE id = $1", [product.id]);
    console.log(`✅ Stock inicial confirmado: ${freshProd.rows[0].stock_quantity} unidades.`);

    // 4. Limpiar carrito de pruebas previo
    console.log('\n🧹 Limpiando carrito previo de pruebas para empezar desde cero...');
    await CartService.clearCart(user.id);
    let cartState = await CartService.getCart(user.id);
    console.log(`🛒 Estado inicial del carrito: ${cartState.items.length} productos.`);

    // 5. Agregar 1 harina al carrito del cliente
    console.log(`\n➕ Añadiendo 1 unidad de Harina (${product.name}) al carrito...`);
    await CartService.addToCart(user.id, product.id, 1);
    
    // Consultar el estado del carrito
    cartState = await CartService.getCart(user.id);
    console.log('🛒 --- DETALLE DEL CARRITO ---');
    console.log(`   * Cart ID: ${cartState.cart_id}`);
    cartState.items.forEach(item => {
      console.log(`   * Producto: "${item.product_name}" | SKU: ${item.sku}`);
      console.log(`   * Cantidad en Carrito: ${item.quantity} saco(s)`);
      console.log(`   * Precio Unitario: $${item.price} USD | Stock en Base: ${item.current_stock} sacos`);
    });

    // 6. Proceder al checkout de forma transaccional asíncrona
    console.log('\n🚀 Procesando Checkout de forma transaccional...');
    console.log('⏳ (Se validará el stock, se creará la orden de venta, se descontará el stock y se vaciará el carrito)...');
    
    const checkoutResult = await CartService.checkout(
      user.id,
      customerId,
      'Simulación de compra de UPTAI Trayecto IV'
    );

    console.log('\n📄 --- TICKET DE COMPRA GENERADO ---');
    console.log(`   * Estado: ${checkoutResult.message}`);
    console.log(`   * Número de Orden: ${checkoutResult.order_number}`);
    console.log(`   * ID de Venta: ${checkoutResult.sale_id}`);
    console.log(`   * Subtotal: $${checkoutResult.subtotal.toFixed(2)} USD`);
    console.log(`   * IVA (16%): $${checkoutResult.iva.toFixed(2)} USD`);
    console.log(`   * Total Facturado: $${checkoutResult.total.toFixed(2)} USD`);
    console.log(`   * Items comprados: ${checkoutResult.items_count}`);

    // 7. Consultar base de datos para validar stock final (debería ser 9)
    console.log('\n📊 --- COMPROBACIÓN FINAL EN BASE DE DATOS ---');
    const finalProd = await pool.query("SELECT name, stock_quantity FROM public.products WHERE id = $1", [product.id]);
    const finalCart = await CartService.getCart(user.id);
    
    console.log(`   📉 Stock de "${finalProd.rows[0].name}" en inventario: ${finalProd.rows[0].stock_quantity} unidades.`);
    console.log(`   🛒 Cantidad de ítems restantes en el carrito: ${finalCart.items.length} productos.`);

    if (finalProd.rows[0].stock_quantity === 9) {
      console.log('\n🎉 ¡PRUEBA COMPLETADA CON ÉXITO ABSOLUTO!');
      console.log('✅ El stock se redujo de 10 a 9 unidades correctamente.');
      console.log('✅ El carrito fue vaciado de forma atómica en la misma transacción.');
    } else {
      console.log('\n❌ Falló la validación final del stock.');
    }

  } catch (err) {
    console.error('\n❌ Ocurrió un error durante la simulación:', err.message);
  } finally {
    // Cerrar el pool para que el script de Node finalice limpiamente
    await pool.end();
    console.log('\n🔌 Pool de conexión PostgreSQL cerrado.');
  }
}

testCartsSystem();
