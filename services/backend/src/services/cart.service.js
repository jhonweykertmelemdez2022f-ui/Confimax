const { Cart } = require('../models/cart.model');
const { query, transaction } = require('../database/queryWrapper');

const CartService = {
  // Obtener carrito completo del usuario
  async getCart(userId) {
    const cart = await Cart.findOrCreateCart(userId);
    const items = await Cart.getCartItems(cart.id);
    return {
      cart_id: cart.id,
      user_id: cart.user_id,
      items
    };
  },

  // Agregar/Actualizar ítem en el carrito
  async addToCart(userId, productId, quantity) {
    const cart = await Cart.findOrCreateCart(userId);
    return Cart.addItem(cart.id, productId, quantity);
  },

  // Eliminar ítem del carrito
  async removeFromCart(userId, productId) {
    const cart = await Cart.findOrCreateCart(userId);
    await Cart.removeItem(cart.id, productId);
    return { success: true };
  },

  // Vaciar el carrito
  async clearCart(userId) {
    const cart = await Cart.findOrCreateCart(userId);
    await Cart.clearCart(cart.id);
    return { success: true };
  },

  // Realizar Checkout y descontar stock transaccionalmente
  async checkout(userId, customerId, notes = 'Compra procesada desde el carrito') {
    return transaction(async (client) => {
      // 1. Obtener carrito
      const cart = await Cart.findOrCreateCart(userId);
      const items = await Cart.getCartItems(cart.id);
      
      if (items.length === 0) {
        throw new Error('El carrito está vacío. Agrega productos antes de realizar la compra.');
      }

      let subtotal = 0;
      const orderItems = [];

      // 2. Validar stock actual para cada ítem en la base de datos dentro de la transacción
      for (const item of items) {
        const { rows } = await client.query(
          'SELECT id, name, sku, unit_price, stock_quantity FROM products WHERE id = $1',
          [item.product_id]
        );
        const product = rows[0];

        if (!product) {
          throw new Error(`El producto con ID ${item.product_id} ya no está disponible en el catálogo.`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Requerido: ${item.quantity}, Disponible: ${product.stock_quantity}`);
        }

        // Calcular costo del item
        const itemTotal = Number(product.unit_price) * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: product.id,
          sku: product.sku,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: product.unit_price,
          total: itemTotal
        });
      }

      // 3. Calcular impuestos (16% IVA)
      const iva = subtotal * 0.16;
      const total = subtotal + iva;

      // 4. Registrar la venta en la tabla de órdenes de venta (sales)
      const orderNumber = `ORD-CART-${Date.now()}`;
      const { rows: saleRows } = await client.query(`
        INSERT INTO sales (customer_id, vendor_id, subtotal, iva, total, currency, status, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `, [
        customerId || null, 
        userId, 
        subtotal, 
        iva, 
        total, 
        'USD', 
        'completed', 
        notes
      ]);
      const sale = saleRows[0];

      // 5. Registrar cada item vendido y descontar stock físicamente (Harina: de 10 a 9...)
      for (const it of orderItems) {
        // Registrar item vendido
        await client.query(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total) 
          VALUES ($1, $2, $3, $4, $5)
        `, [
          sale.id, 
          it.product_id, 
          it.quantity, 
          it.unit_price, 
          it.total
        ]);

        // Descontar del inventario (Resta de stock)
        await client.query(`
          UPDATE products 
          SET stock_quantity = stock_quantity - $1 
          WHERE id = $2
        `, [
          it.quantity, 
          it.product_id
        ]);
        
        console.log(`📉 Stock del producto "${it.product_name}" reducido en ${it.quantity} unidades.`);
      }

      // 6. Vaciar todos los ítems del carrito del cliente
      await client.query(
        'DELETE FROM cart_items WHERE cart_id = $1',
        [cart.id]
      );

      return {
        success: true,
        order_number: orderNumber,
        sale_id: sale.id,
        subtotal,
        iva,
        total,
        items_count: orderItems.length,
        message: 'Compra completada con éxito. Stock descontado.'
      };
    });
  }
};

module.exports = CartService;
