import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Genera un PDF de factura a partir de los datos de una venta y lo comparte.
 * @param {Object} sale - El objeto de la venta con todos sus detalles e items.
 */
export const generateInvoicePDF = async (sale) => {
  if (!sale) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura de Venta</title>
        <style>
            body {
                font-family: 'Helvetica', 'Arial', sans-serif;
                color: #333;
                margin: 0;
                padding: 40px;
                background-color: #fff;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #4f46e5;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo-section h1 {
                margin: 0;
                color: #4f46e5;
                font-size: 32px;
                letter-spacing: 1px;
            }
            .logo-section p {
                margin: 5px 0 0 0;
                color: #666;
                font-size: 14px;
            }
            .invoice-details {
                text-align: right;
            }
            .invoice-details h2 {
                margin: 0 0 10px 0;
                color: #4f46e5;
                font-size: 24px;
            }
            .invoice-details p {
                margin: 3px 0;
                font-size: 13px;
                color: #444;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 11px;
                font-weight: bold;
                color: #888;
                text-transform: uppercase;
                margin-bottom: 8px;
                border-bottom: 1px solid #eee;
                padding-bottom: 4px;
                letter-spacing: 0.5px;
            }
            .customer-info p {
                margin: 4px 0;
                font-size: 15px;
                color: #222;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th {
                background-color: #f8fafc;
                text-align: left;
                padding: 12px 10px;
                font-size: 11px;
                text-transform: uppercase;
                color: #64748b;
                border-bottom: 2px solid #e2e8f0;
            }
            td {
                padding: 12px 10px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
                color: #334155;
            }
            .qty-col { width: 60px; text-align: center; }
            .price-col { width: 100px; text-align: right; }
            .total-col { width: 100px; text-align: right; font-weight: 600; }
            
            .totals-container {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .totals-table {
                width: 280px;
            }
            .totals-table td {
                padding: 6px 10px;
                border-bottom: none;
            }
            .total-label {
                text-align: right;
                font-size: 13px;
                color: #64748b;
            }
            .total-value {
                text-align: right;
                font-size: 14px;
                color: #1e293b;
            }
            .grand-total-row td {
                padding-top: 15px;
                border-top: 2px solid #4f46e5;
                margin-top: 10px;
            }
            .grand-total-label {
                text-align: right;
                font-size: 16px;
                font-weight: bold;
                color: #4f46e5;
            }
            .grand-total-value {
                text-align: right;
                font-size: 22px;
                font-weight: bold;
                color: #4f46e5;
            }
            .footer {
                margin-top: 60px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .footer p {
                font-size: 12px;
                color: #94a3b8;
                margin: 4px 0;
            }
            .status-stamp {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-top: 10px;
            }
            .status-entregado { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .status-pendiente { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
            .status-cancelado { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-section">
                <h1>CONFIMAX</h1>
                <p>Soluciones Inteligentes de Inventario</p>
                <div class="status-stamp status-${(sale.status || 'pendiente').toLowerCase()}">
                    ${sale.status || 'Pendiente'}
                </div>
            </div>
            <div class="invoice-details">
                <h2>FACTURA</h2>
                <p><strong>Nº:</strong> ${sale.order_number || (sale.id ? sale.id.toString().substring(0, 8).toUpperCase() : 'S/N')}</p>
                <p><strong>Fecha:</strong> ${sale.created_at ? new Date(sale.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                <p><strong>Hora:</strong> ${sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()}</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="customer-info">
                <p><strong>Nombre/Razón Social:</strong> ${sale.customer_name || 'Consumidor Final'}</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Detalle de la Transacción</div>
            <table>
                <thead>
                    <tr>
                        <th class="qty-col">CANT.</th>
                        <th>DESCRIPCIÓN</th>
                        <th class="price-col">P. UNITARIO</th>
                        <th class="total-col">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${(sale.items || []).map(item => `
                        <tr>
                            <td class="qty-col">${item.quantity || item.qty}</td>
                            <td>${item.product_name || item.name}</td>
                            <td class="price-col">$${Number(item.unit_price || item.price).toFixed(2)}</td>
                            <td class="total-col">$${(Number(item.quantity || item.qty) * Number(item.unit_price || item.price)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="totals-container">
            <table class="totals-table">
                <tr>
                    <td class="total-label">Subtotal</td>
                    <td class="total-value">$${Number(sale.subtotal || 0).toFixed(2)}</td>
                </tr>
                ${sale.discount > 0 ? `
                <tr>
                    <td class="total-label">Descuento aplicado</td>
                    <td class="total-value">-$${Number(sale.discount || 0).toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td class="total-label">Impuestos (IVA)</td>
                    <td class="total-value">$${Number(sale.tax || sale.iva || 0).toFixed(2)}</td>
                </tr>
                <tr class="grand-total-row">
                    <td class="grand-total-label">TOTAL A PAGAR</td>
                    <td class="grand-total-value">$${Number(sale.total || 0).toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p><strong>¡Gracias por confiar en Confimax!</strong></p>
            <p>Para cualquier duda sobre esta factura, por favor contáctenos.</p>
            <p>Documento generado electrónicamente.</p>
        </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ 
      html: htmlContent,
      base64: false 
    });
    
    await Sharing.shareAsync(uri, { 
      mimeType: 'application/pdf', 
      dialogTitle: `Factura Confimax - ${sale.order_number || sale.id}`,
      UTI: 'com.adobe.pdf' 
    });
    
    return uri;
  } catch (error) {
    console.error('Error al generar o compartir el PDF:', error);
    throw error;
  }
};
