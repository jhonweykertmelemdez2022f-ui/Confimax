const axios = require('axios');
const NotificationsService = require('./notifications.service');
const { NotificationSettings } = require('../models/notification.model');

const JobsService = {
  /**
   * Inicia los trabajos en segundo plano
   */
  start() {
    console.log('[JOBS] Iniciando servicios de monitoreo en segundo plano...');
    
    // Verificar productos por vencer cada 12 horas
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    setInterval(() => this.checkExpiringProducts(), TWELVE_HOURS);
    
    // Ejecución inicial después de 1 minuto
    setTimeout(() => this.checkExpiringProducts(), 60000);
  },

  /**
   * Consulta al servicio de inventario por productos que vencen pronto
   */
  async checkExpiringProducts() {
    try {
      console.log('[JOBS] Ejecutando verificación de productos por vencer...');
      
      const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002';
      
      // Consultamos productos que vencen en los próximos 7 días
      // Necesitamos un token de admin para esto, o el servicio debe permitir llamadas internas
      // Para simplificar, asumiremos que el Gateway o la red interna permite la llamada
      const response = await axios.get(`${inventoryUrl}/products/alerts/expiring?days=7`, {
        headers: { 'Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || 'confimax-internal' }
      });
      
      const expiringProducts = response.data || [];
      
      if (expiringProducts.length > 0) {
        // Enviar a todos los administradores/vendedores que tengan push activado
        const admins = await NotificationSettings.find({ 
          push_notifications: true,
          'notification_types.stock_expiring': true 
        });

        for (const admin of admins) {
          for (const product of expiringProducts) {
            await NotificationsService.createStockExpiringNotification(admin.user_id, {
              id: product.id,
              name: product.name,
              expiration_date: new Date(product.expiration_date).toLocaleDateString()
            });
          }
        }
      }
    } catch (error) {
      console.error('[JOBS] Error en checkExpiringProducts:', error.message);
    }
  }
};

module.exports = JobsService;
