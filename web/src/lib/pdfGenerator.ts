import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF report for any entity.
 * @param title - The title of the report.
 * @param columns - Array of objects with { label, key }.
 * @param data - Array of objects with the data.
 * @param fileName - Optional file name.
 */
export const generateReportPDF = (
  title: string,
  columns: { header: string; dataKey: string }[],
  data: any[],
  fileName: string = 'reporte.pdf'
) => {
  const doc = new jsPDF();

  // Add Logo/Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // #4f46e5
  doc.text('CONFIMAX', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Soluciones Inteligentes de Inventario', 14, 28);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 22);
  doc.text(`Registros: ${data.length}`, 160, 28);

  // Add Report Title
  doc.setFontSize(16);
  doc.text(title, 105, 45, { align: 'center' });

  // Generate Table
  autoTable(doc, {
    startY: 55,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => item[col.dataKey] || '-')),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Reporte generado por Confimax`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(fileName);
};

/**
 * Generate a combined PDF containing products, sales, customers, suppliers and audit logs.
 */
export const generateCombinedPdfAll = async (apiClient: any) => {
  const [productsRes, salesRes, customersRes, suppliersRes, purchasesRes, auditsRes] = await Promise.all([
    apiClient.getProducts().catch(() => ({ data: [] })),
    apiClient.getSales().catch(() => ({ data: [] })),
    apiClient.getCustomers().catch(() => ({ data: [] })),
    apiClient.getSuppliers().catch(() => ({ data: [] })),
    apiClient.getPurchases().catch(() => ({ data: [] })),
    apiClient.getAuditLogs().catch(() => ({ data: [] })),
  ]);

  const products = productsRes.data || [];
  const sales = salesRes.data || [];
  const customers = customersRes.data || [];
  const suppliers = suppliersRes.data || [];
  const purchases = purchasesRes.data || [];
  const audits = auditsRes.data || [];

  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229);
  doc.text('CONFIMAX - Informe combinado', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 160, 22);

  let y = 32;

  const addTable = (title: string, columns: { header: string; dataKey: string }[], data: any[]) => {
    if (y > 240) doc.addPage(), y = 20;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(title, 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [columns.map(c => c.header)],
      body: data.map(item => columns.map(c => item[c.dataKey] != null ? String(item[c.dataKey]) : '-')),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      theme: 'striped'
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  };

  addTable('Productos', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Nombre', dataKey: 'name' },
    { header: 'SKU', dataKey: 'sku' },
    { header: 'Precio', dataKey: 'price' },
    { header: 'Stock', dataKey: 'stock_quantity' }
  ], products);

  addTable('Ventas', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Fecha', dataKey: 'created_at' },
    { header: 'Total', dataKey: 'total' },
    { header: 'Moneda', dataKey: 'currency' }
  ], sales);

  addTable('Clientes', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Nombre', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Teléfono', dataKey: 'phone' }
  ], customers);

  addTable('Proveedores', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Empresa', dataKey: 'company_name' },
    { header: 'Contacto', dataKey: 'contact_name' },
    { header: 'Cédula', dataKey: 'contact_id' },
    { header: 'Teléfono', dataKey: 'phone' },
    { header: 'RIF', dataKey: 'rif' }
  ], suppliers);

  addTable('Compras a Proveedores', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Proveedor', dataKey: 'provider_name' },
    { header: 'Fecha', dataKey: 'date' },
    { header: 'Total', dataKey: 'total' },
    { header: 'IVA', dataKey: 'tax' },
    { header: 'Vence', dataKey: 'due_date' }
  ], purchases);

  addTable('Audit Logs', [
    { header: 'ID', dataKey: 'id' },
    { header: 'Usuario', dataKey: 'user' },
    { header: 'Acción', dataKey: 'action' },
    { header: 'Fecha', dataKey: 'created_at' }
  ], audits);

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - Confimax`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save('confimax-combined-report.pdf');
};
