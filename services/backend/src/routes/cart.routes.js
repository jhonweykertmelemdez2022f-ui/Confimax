const express = require('express');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

// Rutas de Carrito de Compras
router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.delete('/items/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);
router.post('/checkout', cartController.checkout);

module.exports = router;
