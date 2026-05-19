const InventoryService = require('../services/inventory.service');

const productController = {
  async getProduct(req, res, next) {
    try {
      const product = await InventoryService.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) { next(e); }
  },
  async getProductBySku(req, res, next) {
    try {
      const product = await InventoryService.getProductBySku(req.params.sku);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) { next(e); }
  },
  async searchProducts(req, res, next) {
    try { res.json(await InventoryService.searchProducts(req.query.q, parseInt(req.query.limit || 20))); }
    catch (e) { next(e); }
  },
  async searchProductsABC(req, res, next) {
    try { res.json(await InventoryService.searchProductsABC(req.query.prefix, parseInt(req.query.limit || 20))); }
    catch (e) { next(e); }
  },
  async createProduct(req, res, next) {
    try { res.status(201).json(await InventoryService.createProduct(req.body)); }
    catch (e) { next(e); }
  },
  async updateProduct(req, res, next) {
    try {
      const product = await InventoryService.updateProduct(req.params.id, req.body);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) { next(e); }
  },
  async deleteProduct(req, res, next) {
    try { await InventoryService.deleteProduct(req.params.id); res.status(204).send(); }
    catch (e) { next(e); }
  },
  async listProducts(req, res, next) {
    try {
      const { limit = 50, offset = 0, category_id } = req.query;
      res.json(await InventoryService.listProducts(parseInt(limit), parseInt(offset), { category_id }));
    } catch (e) { next(e); }
  },
  async getProductStock(req, res, next) {
    try { res.json({ product_id: req.params.id, total_stock: parseInt(await InventoryService.getProductTotalStock(req.params.id)) }); }
    catch (e) { next(e); }
  },
  async checkExpiringProducts(req, res, next) {
    try {
      const daysAhead = parseInt(req.query.days || 30);
      const products = await InventoryService.getExpiringProducts(daysAhead);
      
      // Intentar notificar al servicio de notificaciones si hay productos por expirar
      if (products.length > 0) {
        const notificationsUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
        const authHeader = req.headers.authorization;
        
        for (const product of products) {
          try {
            // Disparar llamada asíncrona no-bloqueante al servicio de notificaciones
            fetch(`${notificationsUrl}/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify({
                type: 'stock_expiring',
                title: 'Alerta: Producto por vencer',
                message: `El producto "${product.name}" (SKU: ${product.sku}) vencerá el ${new Date(product.expiration_date).toLocaleDateString()}.`,
                user_id: req.user ? req.user.id : '00000000-0000-0000-0000-000000000000' // ID del sistema o usuario actual
              })
            }).catch(err => console.error('[INVENTORY] Error enviando alerta al notificador:', err.message));
          } catch (err) {
            console.error('[INVENTORY] Error intentando notificar:', err.message);
          }
        }
      }

      res.json(products);
    } catch (e) { next(e); }
  },
};

module.exports = productController;
