const CartService = require('../services/cart.service');

const cartController = {
  // Obtener el estado del carrito actual del usuario
  async getCart(req, res, next) {
    try {
      // Tomamos el userId del usuario autenticado (inyectado por middleware de auth)
      // O como fallback de query param para facilitar pruebas
      const userId = req.user?.userId || req.query.user_id;
      if (!userId) {
        return res.status(400).json({ message: 'Se requiere identificación de usuario (user_id).' });
      }

      const cart = await CartService.getCart(userId);
      res.json(cart);
    } catch (e) {
      next(e);
    }
  },

  // Añadir o actualizar cantidad de un producto en el carrito
  async addToCart(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.user_id;
      const { product_id, quantity = 1 } = req.body;

      if (!userId || !product_id) {
        return res.status(400).json({ message: 'Falta user_id o product_id en la petición.' });
      }

      const item = await CartService.addToCart(userId, product_id, parseInt(quantity));
      res.status(200).json({
        message: 'Producto añadido/actualizado en el carrito.',
        item
      });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },

  // Eliminar un producto del carrito
  async removeFromCart(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.user_id || req.query.user_id;
      const { productId } = req.params;

      if (!userId || !productId) {
        return res.status(400).json({ message: 'Falta user_id o productId en la petición.' });
      }

      const result = await CartService.removeFromCart(userId, productId);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  // Vaciar por completo el carrito
  async clearCart(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.user_id || req.query.user_id;
      if (!userId) {
        return res.status(400).json({ message: 'Se requiere identificación de usuario (user_id).' });
      }

      const result = await CartService.clearCart(userId);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  // Procesar compra total y descontar stock
  async checkout(req, res, next) {
    try {
      const userId = req.user?.userId || req.body.user_id;
      const { customer_id, notes } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'Se requiere identificación de usuario (user_id) para checkout.' });
      }

      const checkoutResult = await CartService.checkout(userId, customer_id, notes);
      res.status(200).json(checkoutResult);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
};

module.exports = cartController;
