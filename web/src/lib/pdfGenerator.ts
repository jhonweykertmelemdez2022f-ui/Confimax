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
