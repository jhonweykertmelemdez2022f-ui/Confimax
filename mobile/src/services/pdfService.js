import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { inventoryAPI, salesAPI, customersAPI, notificationsAPI, auditAPI, providersAPI } from './api';

// Generates a combined PDF containing summaries for inventory, sales, customers, providers and audit logs.
export async function generateCombinedPdfForAdmin() {
  try {
    const [productsRes, salesRes, customersRes, providersRes, purchasesRes, auditsRes] = await Promise.all([
      inventoryAPI.getProducts().catch(() => ({ data: [] })),
      salesAPI.getSales().catch(() => ({ data: [] })),
      customersAPI.getCustomers().catch(() => ({ data: [] })),
      providersAPI.getProviders().catch(() => ({ data: [] })),
      providersAPI.getPurchases().catch(() => ({ data: [] })),
      auditAPI.getAuditLogs().catch(() => ({ data: [] })),
    ]);

    const products = productsRes.data || [];
    const sales = salesRes.data || [];
    const customers = customersRes.data || [];
    const providers = providersRes.data || [];
    const purchases = purchasesRes.data || [];
    const audits = auditsRes.data || [];

    const htmlParts = [];
    htmlParts.push('<h1 style="text-align:center">Informe combinado - Confimax</h1>');
    htmlParts.push('<hr/>');

    // Products
    htmlParts.push('<h2>Productos</h2>');
    if (products.length === 0) {
      htmlParts.push('<p>No hay productos.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Nombre</th><th>SKU</th><th>Precio</th><th>Stock</th></tr>');
      products.forEach(p => {
        htmlParts.push(`<tr><td>${p.id || ''}</td><td>${p.name || p.product_name || ''}</td><td>${p.sku || ''}</td><td>${p.price != null ? p.price : ''}</td><td>${p.quantity != null ? p.quantity : ''}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    // Sales
    htmlParts.push('<h2>Ventas</h2>');
    if (sales.length === 0) {
      htmlParts.push('<p>No hay ventas.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Fecha</th><th>Total</th><th>Moneda</th></tr>');
      sales.forEach(s => {
        htmlParts.push(`<tr><td>${s.id || ''}</td><td>${s.created_at ? new Date(s.created_at).toLocaleString() : ''}</td><td>${s.total != null ? s.total : ''}</td><td>${s.currency || 'USD'}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    // Customers
    htmlParts.push('<h2>Clientes</h2>');
    if (customers.length === 0) {
      htmlParts.push('<p>No hay clientes.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th></tr>');
      customers.forEach(c => {
        htmlParts.push(`<tr><td>${c.id || ''}</td><td>${c.name || c.full_name || ''}</td><td>${c.email || ''}</td><td>${c.phone || ''}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    // Providers
    htmlParts.push('<h2>Proveedores</h2>');
    if (providers.length === 0) {
      htmlParts.push('<p>No hay proveedores.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Empresa</th><th>Vendedor</th><th>Cédula</th><th>Teléfono</th><th>RIF</th></tr>');
      providers.forEach(p => {
        htmlParts.push(`<tr><td>${p.id || ''}</td><td>${p.company_name || p.description || ''}</td><td>${p.contact_name || ''}</td><td>${p.contact_id || p.cedula || ''}</td><td>${p.phone || ''}</td><td>${p.rif || ''}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    // Purchases
    htmlParts.push('<h2>Compras a Proveedores</h2>');
    if (purchases.length === 0) {
      htmlParts.push('<p>No hay compras registradas.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Proveedor</th><th>Fecha</th><th>Total</th><th>IVA</th><th>Vence</th></tr>');
      purchases.forEach(pp => {
        htmlParts.push(`<tr><td>${pp.id || ''}</td><td>${pp.provider_name || pp.supplier || ''}</td><td>${pp.date ? new Date(pp.date).toLocaleDateString() : ''}</td><td>${pp.total != null ? pp.total : ''}</td><td>${pp.tax != null ? pp.tax : ''}</td><td>${pp.due_date ? new Date(pp.due_date).toLocaleDateString() : ''}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    // Audit logs
    htmlParts.push('<h2>Audit Logs</h2>');
    if (audits.length === 0) {
      htmlParts.push('<p>No hay logs de auditoría.</p>');
    } else {
      htmlParts.push('<table border="1" cellpadding="4" cellspacing="0" width="100%">');
      htmlParts.push('<tr><th>ID</th><th>Usuario</th><th>Acción</th><th>Fecha</th></tr>');
      audits.forEach(a => {
        htmlParts.push(`<tr><td>${a.id || ''}</td><td>${a.user || a.username || ''}</td><td>${a.action || a.event || ''}</td><td>${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</td></tr>`);
      });
      htmlParts.push('</table>');
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family: Arial, Helvetica, sans-serif; padding: 12px;} table{border-collapse: collapse;} th{background:#f3f4f6}</style></head><body>${htmlParts.join('\n')}</body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    // Offer share/save
    if (uri) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      return uri;
    }
    return null;
  } catch (err) {
    console.log('Error generating combined PDF:', err);
    throw err;
  }
}
