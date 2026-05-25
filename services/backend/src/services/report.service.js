const PDFDocument = require('pdfkit');

const ReportService = {
  async generateProductsPDF(products) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(25).text('Reporte de Productos Confimax', { align: 'center' });
      doc.moveDown();

      const tableTop = 150;
      const tableLeft = 50;
      const colWidths = [150, 100, 80, 80];

      // Table Headers
      doc.font('Helvetica-Bold');
      doc.text('Nombre', tableLeft, tableTop);
      doc.text('SKU', tableLeft + colWidths[0], tableTop);
      doc.text('Precio', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Stock', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.font('Helvetica');
      let y = tableTop + 25;

      // Table Rows
      products.forEach((product) => {
        if (y > 750) { // Check for page overflow
          doc.addPage();
          doc.font('Helvetica-Bold');
          doc.text('Nombre', tableLeft, 50);
          doc.text('SKU', tableLeft + colWidths[0], 50);
          doc.text('Precio', tableLeft + colWidths[0] + colWidths[1], 50);
          doc.text('Stock', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], 50);
          doc.font('Helvetica');
          y = 75;
        }

        doc.text(product.name || '-', tableLeft, y);
        doc.text(`SKU: ${product.sku || '-'}`, tableLeft + colWidths[0], y);
        doc.text(`$${(product.unitPrice || 0).toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1], y);
        doc.text(String(product.stockQuantity || 0), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        y += 20;
      });

      // Footer
      doc.fontSize(10).text('Confimax - Reporte Generado', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  },

  async generateUsersPDF(users) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(25).text('Reporte de Usuarios Confimax', { align: 'center' });
      doc.moveDown();

      const tableTop = 150;
      const tableLeft = 50;
      const colWidths = [150, 150, 100, 100]; // Username, Email, Role, Active

      // Table Headers
      doc.font('Helvetica-Bold');
      doc.text('Usuario', tableLeft, tableTop);
      doc.text('Email', tableLeft + colWidths[0], tableTop);
      doc.text('Rol', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Activo', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.font('Helvetica');
      let y = tableTop + 25;

      // Table Rows
      users.forEach((user) => {
        if (y > 750) { // Check for page overflow
          doc.addPage();
          doc.font('Helvetica-Bold');
          doc.text('Usuario', tableLeft, 50);
          doc.text('Email', tableLeft + colWidths[0], 50);
          doc.text('Rol', tableLeft + colWidths[0] + colWidths[1], 50);
          doc.text('Activo', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], 50);
          doc.font('Helvetica');
          y = 75;
        }

        doc.text(user.username || '-', tableLeft, y);
        doc.text(user.email || '-', tableLeft + colWidths[0], y);
        doc.text(user.role || '-', tableLeft + colWidths[0] + colWidths[1], y);
        doc.text(user.active ? 'Sí' : 'No', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        y += 20;
      });

      // Footer
      doc.fontSize(10).text('Confimax - Reporte Generado', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  },

  async generateSalesPDF(sales) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(25).text('Reporte de Ventas Confimax', { align: 'center' });
      doc.moveDown();

      const tableTop = 150;
      const tableLeft = 50;
      const colWidths = [100, 100, 80, 80, 80]; // Date, Customer, Subtotal, Discount, IVA, Total

      // Table Headers
      doc.font('Helvetica-Bold');
      doc.text('Fecha', tableLeft, tableTop);
      doc.text('Cliente', tableLeft + colWidths[0], tableTop);
      doc.text('Subtotal', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Descuento', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.text('IVA', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
      doc.text('Total', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
      doc.font('Helvetica');
      let y = tableTop + 25;

      let totalRecaudado = 0;
      let totalIVA = 0;
      let totalDescuentos = 0;

      // Table Rows
      sales.forEach((sale) => {
        if (y > 750) { // Check for page overflow
          doc.addPage();
          doc.font('Helvetica-Bold');
          doc.text('Fecha', tableLeft, 50);
          doc.text('Cliente', tableLeft + colWidths[0], 50);
          doc.text('Subtotal', tableLeft + colWidths[0] + colWidths[1], 50);
          doc.text('Descuento', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], 50);
          doc.text('IVA', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], 50);
          doc.text('Total', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], 50);
          doc.font('Helvetica');
          y = 75;
        }

        const saleDate = new Date(sale.created_at).toLocaleDateString();
        const customerName = sale.customer_name || 'Cliente General';
        const subtotal = sale.subtotal ? sale.subtotal.toFixed(2) : '0.00';
        const discount = sale.discount_amount ? sale.discount_amount.toFixed(2) : '0.00';
        const iva = sale.iva ? sale.iva.toFixed(2) : '0.00';
        const total = sale.total ? sale.total.toFixed(2) : '0.00';

        doc.text(saleDate, tableLeft, y);
        doc.text(customerName, tableLeft + colWidths[0], y);
        doc.text(`$${subtotal}`, tableLeft + colWidths[0] + colWidths[1], y);
        doc.text(`$${discount}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text(`$${iva}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        doc.text(`$${total}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
        y += 20;

        totalRecaudado += parseFloat(sale.total || 0);
        totalIVA += parseFloat(sale.iva || 0);
        totalDescuentos += parseFloat(sale.discount_amount || 0);
      });

      // Summary
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen:', tableLeft, y + 20);
      doc.fontSize(12).font('Helvetica').text(`Total Recaudado: $${totalRecaudado.toFixed(2)}`, tableLeft, y + 40);
      doc.text(`Total IVA: $${totalIVA.toFixed(2)}`, tableLeft, y + 60);
      doc.text(`Total Descuentos: $${totalDescuentos.toFixed(2)}`, tableLeft, y + 80);

      // Footer
      doc.fontSize(10).text('Confimax - Reporte Generado', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  },

  async generateCustomersPDF(customers) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(25).text('Reporte de Clientes Confimax', { align: 'center' });
      doc.moveDown();

      const tableTop = 150;
      const tableLeft = 50;
      const colWidths = [150, 100, 150, 100]; // Name, RIF, Email, Phone

      // Table Headers
      doc.font('Helvetica-Bold');
      doc.text('Nombre', tableLeft, tableTop);
      doc.text('RIF', tableLeft + colWidths[0], tableTop);
      doc.text('Email', tableLeft + colWidths[0] + colWidths[1], tableTop);
      doc.text('Teléfono', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
      doc.font('Helvetica');
      let y = tableTop + 25;

      // Table Rows
      customers.forEach((customer) => {
        if (y > 750) { // Check for page overflow
          doc.addPage();
          doc.font('Helvetica-Bold');
          doc.text('Nombre', tableLeft, 50);
          doc.text('RIF', tableLeft + colWidths[0], 50);
          doc.text('Email', tableLeft + colWidths[0] + colWidths[1], 50);
          doc.text('Teléfono', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], 50);
          doc.font('Helvetica');
          y = 75;
        }

        doc.text(customer.name || '-', tableLeft, y);
        doc.text(customer.tax_id || '-', tableLeft + colWidths[0], y);
        doc.text(customer.email || '-', tableLeft + colWidths[0] + colWidths[1], y);
        doc.text(customer.phone || '-', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        y += 20;
      });

      // Footer
      doc.fontSize(10).text('Confimax - Reporte Generado', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  },
};

module.exports = ReportService;