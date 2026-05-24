const Groq = require('groq-sdk');
const config = require('../config');
const dbService = require('../services/database.service');

const groq = new Groq({
  apiKey: config.groq.apiKey
});

const formatDataForContext = (data, role) => {
  let context = `\n\n=== DATOS DISPONIBLES PARA TU ROL (${role.toUpperCase()}) ===\n`;
  
  // Explicar claramente las restricciones del rol
  if (role === 'cliente') {
    context += '\nRESTRICCIONES: Como CLIENTE, solo puedes ver el CATÁLOGO DE PRODUCTOS. No tienes acceso a clientes, ventas ni usuarios.\n';
  } else if (role === 'vendedor') {
    context += '\nRESTRICCIONES: Como VENDEDOR, puedes ver PRODUCTOS, CLIENTES y VENTAS. No tienes acceso a USUARIOS ni AUDITORÍA.\n';
  } else if (role === 'admin') {
    context += '\nRESTRICCIONES: Como ADMINISTRADOR, tienes acceso a TODO: productos, clientes, ventas y usuarios.\n';
  }
  
  context += '\nINFORMACIÓN CONTEXTUAL ACTUAL (usa solo estos datos):\n';
  
  if (data.products && data.products.length > 0) {
    context += '\n## PRODUCTOS DISPONIBLES\n';
    context += '| Producto | SKU | Precio | Stock |\n';
    context += '|----------|-----|--------|-------|\n';
    data.products.forEach(p => {
      context += `| ${p.name} | ${p.sku} | $${p.price} | ${p.stock_quantity} |\n`;
    });
  }
  
  if (data.customers && data.customers.length > 0) {
    context += '\n## CLIENTES\n';
    context += '| Nombre | Email | Teléfono |\n';
    context += '|--------|-------|----------|\n';
    data.customers.forEach(c => {
      context += `| ${c.name} | ${c.email || '-'} | ${c.phone || '-'} |\n`;
    });
  }
  
  if (data.sales && data.sales.length > 0) {
    context += '\n## VENTAS RECIENTES\n';
    context += '| Venta # | Cliente | Total | Fecha |\n';
    context += '|---------|---------|-------|-------|\n';
    data.sales.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString('es-ES');
      context += `| ${s.id} | ${s.customer_name || 'N/A'} | $${s.total} | ${date} |\n`;
    });
  }
  
  if (data.users && data.users.length > 0) {
    context += '\n## USUARIOS\n';
    context += '| Usuario | Email | Rol |\n';
    context += '|---------|-------|-----|\n';
    data.users.forEach(u => {
      context += `| ${u.username} | ${u.email} | ${u.role} |\n`;
    });
  }
  
  context += '\n\nINSTRUCCIONES: RESPONDE USANDO EXACTAMENTE EL MISMO FORMATO DE TABLA MARKDOWN. NO USES LISTAS, USA SOLO TABLAS. Si el usuario pregunta por información que no tiene acceso (según su rol), explícale claramente que no tiene permisos para ver esos datos.\n';
  
  return context;
};

const chatController = {
  async chat(req, res, next) {
    try {
      console.log('[Fabiana] Recibida solicitud:', {
        body: req.body,
        hasMessages: !!req.body.messages,
        messagesLength: req.body.messages?.length,
        role: req.body.role
      });
      
      // Validar que la API Key esté configurada
      if (!config.groq.apiKey) {
        return res.status(500).json({ 
          error: 'GROQ_API_KEY no está configurada en el servidor',
          details: 'Por favor, configura la variable de entorno GROQ_API_KEY en el servicio Fabiana'
        });
      }

      const { messages, stream = false, role = 'cliente' } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages are required' });
      }

      // Obtener datos contextuales según el rol
      let contextData = {};
      try {
        contextData = await dbService.getDataByRole(role);
        console.log('[Fabiana] Datos contextuales obtenidos para rol:', role);
      } catch (dbError) {
        console.error('[Fabiana] Error al obtener datos contextuales:', dbError);
      }

      // Formatear el contexto para incluirlo en el system prompt
      const contextText = formatDataForContext(contextData, role);
      
      // Añadir el system prompt con contexto
      const fullMessages = [
        { 
          role: 'system', 
          content: `${config.systemPrompt}\n\nInformación contextual actual (según tu rol de ${role}):${contextText || '\n(No hay datos disponibles en este momento)'}`
        },
        ...messages
      ];
      
      console.log('[Fabiana] Enviando a Groq:', {
        messagesCount: fullMessages.length,
        model: config.groq.model
      });

      const completion = await groq.chat.completions.create({
        messages: fullMessages,
        model: config.groq.model,
        temperature: 0.7,
        max_tokens: 2048,
        stream
      });

      if (stream) {
        // Streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        // No streaming
        const message = completion.choices[0]?.message?.content || '';
        console.log('[Fabiana] Respuesta de Groq recibida');
        res.json({ message });
      }
    } catch (error) {
      console.error('[AI Chat Error]:', error.message);
      console.error('[AI Chat Error Stack]:', error.stack);
      
      // Manejar errores específicos de la API de Groq si están disponibles
      const status = error.status || 500;
      const message = error.message || 'Error processing your request';
      
      res.status(status).json({
        error: 'Error en el servicio de IA',
        message: message,
        details: config.nodeEnv === 'development' ? error.stack : undefined
      });
    }
  }
};

module.exports = chatController;
