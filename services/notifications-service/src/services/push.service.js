const { NotificationSettings } = require('../models/notification.model');

const PushService = {
  /**
   * Envía una notificación push a todos los dispositivos registrados de un usuario
   * @param {string} userId ID del usuario
   * @param {string} title Título de la notificación
   * @param {string} body Cuerpo de la notificación
   * @param {Object} data Datos adicionales
   */
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      const settings = await NotificationSettings.findOne({ user_id: userId });
      
      if (!settings || !settings.push_notifications || !settings.push_tokens || settings.push_tokens.length === 0) {
        return;
      }

      const messages = settings.push_tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      console.log(`[PUSH] Enviando ${messages.length} notificaciones a usuario ${userId}`);

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      // Manejar tokens inválidos
      if (result.data) {
        const tokensToRemove = [];
        result.data.forEach((item, index) => {
          if (item.status === 'error' && item.details && item.details.error === 'DeviceNotRegistered') {
            tokensToRemove.push(settings.push_tokens[index]);
          }
        });

        if (tokensToRemove.length > 0) {
          console.log(`[PUSH] Limpiando ${tokensToRemove.length} tokens inválidos para usuario ${userId}`);
          await NotificationSettings.updateOne(
            { user_id: userId },
            { $pull: { push_tokens: { $in: tokensToRemove } } }
          );
        }
      }

      return result;
    } catch (error) {
      console.error('[PUSH] Error enviando notificación push:', error.message);
    }
  }
};

module.exports = PushService;
