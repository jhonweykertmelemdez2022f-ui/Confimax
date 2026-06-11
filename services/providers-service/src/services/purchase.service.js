const path = require('path');
const sharedPath = process.env.SHARED_MODULES_PATH || path.resolve(__dirname, '../../..', 'shared');
const { query, transaction } = require(path.join(sharedPath, 'database'));
const { v4: uuidv4 } = require('uuid');

const recordPurchase = async (providerId, data, user) => {
  const id = uuidv4();
  const text = `INSERT INTO purchases (id, supplier_id, total, tax, items, due_date, created_by, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, now()) RETURNING *`;
  const values = [id, providerId, data.total, data.tax || 0, JSON.stringify(data.items || []), data.due_date || null, user?.id || null];
  const res = await query(text, values);
  return res.rows[0];
};

const listPurchases = async (params) => {
  const res = await query('SELECT p.*, s.company_name as provider_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.created_at DESC LIMIT 200');
  return res.rows;
};

const getExpiringPurchases = async (days = 7) => {
  const text = `SELECT p.*, s.company_name as provider_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.due_date IS NOT NULL AND p.due_date <= (now() + ($1 || ' days')::interval) AND (p.paid IS DISTINCT FROM true) ORDER BY p.due_date ASC`;
  const res = await query(text, [days]);
  return res.rows;
};

module.exports = { recordPurchase, listPurchases, getExpiringPurchases };
