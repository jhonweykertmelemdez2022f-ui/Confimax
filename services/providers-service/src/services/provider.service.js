const path = require('path');
const sharedPath = process.env.SHARED_MODULES_PATH || path.resolve(__dirname, '../../..', 'shared');
const { query, transaction } = require(path.join(sharedPath, 'database'));
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Inventory service URL (try external, then internal service name)
const inventoryUrl = (process.env.INVENTORY_SERVICE_URL && process.env.INVENTORY_SERVICE_URL.trim())
  || (process.env.INVENTORY_SERVICE_INTERNAL_URL && process.env.INVENTORY_SERVICE_INTERNAL_URL.trim())
  || 'http://confimax-inventory-service:10000';

const listProviders = async (params) => {
  const res = await query('SELECT * FROM suppliers ORDER BY company_name LIMIT 100');
  return res.rows;
};

const searchProviders = async (q) => {
  const text = 'SELECT * FROM suppliers WHERE company_name ILIKE $1 OR contact_name ILIKE $1 LIMIT 50';
  const res = await query(text, [`%${q}%`]);
  return res.rows;
};

const getProviderById = async (id) => {
  const res = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return res.rows[0];
};

const createProvider = async (data) => {
  const id = uuidv4();
  const text = `INSERT INTO suppliers (id, company_name, description, sells, contact_name, contact_id, phone, rif, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) RETURNING *`;
  const values = [id, data.company_name, data.description || null, data.sells || null, data.contact_name || null, data.contact_id || null, data.phone || null, data.rif || null];
  const res = await query(text, values);
  return res.rows[0];
};

const updateProvider = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['company_name','description','sells','contact_name','contact_id','phone','rif']) {
    if (data[key] !== undefined) { fields.push(`${key} = $${idx}`); values.push(data[key]); idx++; }
  }
  if (fields.length === 0) return getProviderById(id);
  const text = `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);
  const res = await query(text, values);
  return res.rows[0];
};

const deleteProvider = async (id) => {
  await query('DELETE FROM supplier_products WHERE supplier_id = $1', [id]);
  await query('DELETE FROM purchases WHERE supplier_id = $1', [id]);
  await query('DELETE FROM suppliers WHERE id = $1', [id]);
};

// Products
const getProviderProducts = async (providerId) => {
  const res = await query('SELECT * FROM supplier_products WHERE supplier_id = $1 ORDER BY name', [providerId]);
  return res.rows;
};

const addProviderProduct = async (providerId, data) => {
  const id = uuidv4();
  const text = `INSERT INTO supplier_products (id, supplier_id, name, sku, price, created_at) VALUES ($1,$2,$3,$4,$5, now()) RETURNING *`;
  const values = [id, providerId, data.name, data.sku || null, data.price || 0];
  const res = await query(text, values);
  const created = res.rows[0];

  // Try to create the product in inventory to keep catalog in sync.
  // Non-blocking: if inventory is unavailable or SKU exists, just log and continue.
  (async () => {
    try {
      const payload = {
        name: data.name,
        sku: data.sku,
        price: data.price,
        stock_quantity: data.stock_quantity || 0,
      };
      await axios.post(`${inventoryUrl}/products`, payload, { timeout: 5000 });
      console.log('[PROVIDERS] Created product in inventory for SKU', data.sku);
    } catch (err) {
      // If SKU already exists or inventory returns error, ignore but log
      console.warn('[PROVIDERS] Could not create product in inventory:', err.message || err.toString());
    }
  })();

  return created;
};

const updateProviderProduct = async (providerId, productId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['name','sku','price']) {
    if (data[key] !== undefined) { fields.push(`${key} = $${idx}`); values.push(data[key]); idx++; }
  }
  if (fields.length === 0) {
    const res = await query('SELECT * FROM supplier_products WHERE id = $1 AND supplier_id = $2', [productId, providerId]);
    return res.rows[0];
  }
  const text = `UPDATE supplier_products SET ${fields.join(', ')} WHERE id = $${idx} AND supplier_id = $${idx+1} RETURNING *`;
  values.push(productId, providerId);
  const res = await query(text, values);
  return res.rows[0];
};

const deleteProviderProduct = async (providerId, productId) => {
  await query('DELETE FROM supplier_products WHERE id = $1 AND supplier_id = $2', [productId, providerId]);
};

module.exports = {
  listProviders,
  searchProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderProducts,
  addProviderProduct,
  updateProviderProduct,
  deleteProviderProduct,
};
