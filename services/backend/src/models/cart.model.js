const { query, transaction } = require('../database/queryWrapper');

const Cart = {
  // Buscar o crear un carrito para un usuario
  async findOrCreateCart(userId) {
    // Buscar carrito existente
    let res = await query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (res.rows[0]) {
      return res.rows[0];
    }
    
    // Crear si no existe
    res = await query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return res.rows[0];
  },

  // Obtener los ítems del carrito con los detalles del producto
  async getCartItems(cartId) {
    const { rows } = await query(`
      SELECT 
        ci.id,
        ci.cart_id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        p.name as product_name,
        p.sku,
        p.unit_price as price,
        p.stock_quantity as current_stock
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC
    `, [cartId]);
    return rows;
  },

  // Agregar o actualizar un producto en el carrito
  async addItem(cartId, productId, quantity) {
    // Validar stock existente primero
    const prodRes = await query('SELECT stock_quantity, name FROM products WHERE id = $1', [productId]);
    const product = prodRes.rows[0];
    if (!product) {
      throw new Error('El producto no existe.');
    }
    
    if (product.stock_quantity < quantity) {
      throw new Error(`Stock insuficiente para "${product.name}". Stock disponible: ${product.stock_quantity}`);
    }

    // Insertar o actualizar si ya existe en el carrito
    const res = await query(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
      RETURNING *
    `, [cartId, productId, quantity]);
    
    return res.rows[0];
  },

  // Eliminar un producto del carrito
  async removeItem(cartId, productId) {
    await query(
      'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
  },

  // Limpiar todos los ítems de un carrito
  async clearCart(cartId) {
    await query(
      'DELETE FROM cart_items WHERE cart_id = $1',
      [cartId]
    );
  }
};

module.exports = { Cart };
