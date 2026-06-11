const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
process.env.SHARED_MODULES_PATH = path.resolve(__dirname, '../../shared');

const providerService = require('../src/services/provider.service');
const purchaseService = require('../src/services/purchase.service');
const { pool } = require(path.join(process.env.SHARED_MODULES_PATH, 'database'));

const run = async () => {
  try {
    console.log('=== Simulación de gestión de proveedor ===');
    await pool.query('SELECT 1');
    console.log('Conexión a PostgreSQL OK');

    const providerData = {
      company_name: `Proveedor prueba ${Date.now()}`,
      description: 'Proveedor creado para simulación',
      sells: 'Suministros de oficina',
      contact_name: 'Gabriel Pérez',
      contact_id: 'V-12345678',
      phone: '0414-1234567',
      rif: 'J-12345678-9',
    };

    const createdProvider = await providerService.createProvider(providerData);
    console.log('Proveedor creado:', createdProvider);

    const listedProviders = await providerService.listProviders();
    console.log(`Listado de proveedores (primeros 5 / total ${listedProviders.length}):`, listedProviders.slice(0, 5));

    const updatedProvider = await providerService.updateProvider(createdProvider.id, {
      phone: '0426-7654321',
      description: 'Proveedor actualizado desde simulación',
    });
    console.log('Proveedor actualizado:', updatedProvider);

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const purchaseData = {
      total: 1500.0,
      tax: 240.0,
      due_date: dueDate,
      items: [{ description: 'Kit de papelería' }],
    };

    const createdPurchase = await purchaseService.recordPurchase(createdProvider.id, purchaseData, { id: '00000000-0000-0000-0000-000000000000' });
    console.log('Compra registrada:', createdPurchase);

    const expiringPurchases = await purchaseService.getExpiringPurchases(7);
    console.log(`Compras con vencimiento en 7 días o menos (${expiringPurchases.length}):`, expiringPurchases.slice(0, 5));

    await providerService.deleteProvider(createdProvider.id);
    console.log('Proveedor eliminado:', createdProvider.id);

    const finalProviders = await providerService.listProviders();
    console.log(`Listado final de proveedores (primeros 5 / total ${finalProviders.length}):`, finalProviders.slice(0, 5));
  } catch (err) {
    console.error('Error en la simulación:', err);
  } finally {
    await pool.end();
    console.log('Conexión cerrada');
  }
};

run();
