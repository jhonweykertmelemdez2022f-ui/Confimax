const PDFDocument = require('pdfkit');

const generateProductsPDF = (products) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Título
      doc
        .fontSize(24)
        .text('Lista de Productos - Confimax', { align: 'center' })
        .moveDown();

      // Fecha de generación (hora de Venezuela)
      doc
        .fontSize(10)
        .text(`Generado el: ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Caracas'
        })}`, { align: 'center' })
        .moveDown(2);

      // Encabezados de la tabla
      const tableTop = 150;
      const tableLeft = 50;
      const colWidths = [200, 100, 80, 80];
      const headers = ['Producto', 'SKU', 'Precio', 'Stock'];

      // Dibujar encabezados
      doc
        .fontSize(12)
        .font('Helvetica-Bold');

      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop);
        x += colWidths[i];
      });

      // Línea separadora
      doc
        .moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      // Datos de productos
      doc.font('Helvetica');
      let y = tableTop + 30;

      products.forEach((product) => {
        x = tableLeft;
        
        doc.text(product.name || '-', x, y);
        x += colWidths[0];
        
        doc.text(product.sku || '-', x, y);
        x += colWidths[1];
        
        doc.text(`$${product.price || 0}`, x, y);
        x += colWidths[2];
        
        doc.text(String(product.stock_quantity || 0), x, y);
        
        y += 25;

        // Salto de página si es necesario
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // Pie de página
      doc
        .fontSize(8)
        .text('Confimax - Sistema de Gestión de Inventarios', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateProductsPDF
};