const { Pool } = require('pg');
const config = require('../config');

const poolConfig = config.db.url
  ? {
      connectionString: config.db.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Añadir SSL si está configurado
if (config.db.ssl) {
  poolConfig.ssl = config.db.ssl;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    const isSupabase = (config.db.url || config.db.host || '').includes('supabase.co');
    console.log(`✅ Inventory DB: ${isSupabase ? 'Supabase' : 'PostgreSQL Local'}`);
  }
});

// Helper to check if product_images table exists
let productImagesTableExists = null;
const checkProductImagesTable = async (client = null) => {
  if (productImagesTableExists !== null) return productImagesTableExists;
  try {
    const queryClient = client || pool;
    await queryClient.query('SELECT 1 FROM inventory.product_images LIMIT 1');
    productImagesTableExists = true;
    console.log('[PRODUCT MODEL] product_images table exists');
  } catch (err) {
    productImagesTableExists = false;
    console.log('[PRODUCT MODEL] product_images table does NOT exist');
  }
  return productImagesTableExists;
};

const Product = {
  async findById(id) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    if (!result.rows[0]) return null;
    const product = result.rows[0];
    
    const tableExists = await checkProductImagesTable();
    if (tableExists) {
      try {
        const imagesResult = await pool.query(
          'SELECT * FROM inventory.product_images WHERE product_id = $1 ORDER BY display_order, created_at',
          [id]
        );
        product.images = imagesResult.rows;
      } catch (err) {
        product.images = [];
      }
    } else {
      product.images = [];
    }
    return product;
  },

  async findBySku(sku) {
    const result = await pool.query(
      'SELECT * FROM inventory.products WHERE sku = $1 AND is_active = true',
      [sku]
    );
    return result.rows[0];
  },

  async searchByName(query, limit = 20) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.name ILIKE $1 AND p.is_active = true 
       ORDER BY p.name 
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  },

  async searchABC(prefix, limit = 20) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.name ILIKE $1 AND p.is_active = true 
       ORDER BY p.name 
       LIMIT $2`,
      [`${prefix}%`, limit]
    );
    return result.rows;
  },

  async create(productData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const {
        name, sku, description, category_id,
        price, cost, is_active, expiration_date, stock_quantity, image_url, images
      } = productData;

      // Collect all image URLs
      const imageUrls = [];
      if (image_url) {
        imageUrls.push(image_url);
      }
      if (images && Array.isArray(images)) {
        images.forEach(img => {
          if (typeof img === 'string') {
            imageUrls.push(img);
          } else if (img.url) {
            imageUrls.push(img.url);
          }
        });
      }

      const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

      const result = await client.query(
        `INSERT INTO inventory.products 
         (name, sku, description, category_id, price, cost, is_active, expiration_date, stock_quantity, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          name, sku, description, category_id, price, cost, 
          is_active !== undefined ? is_active : true, 
          expiration_date || null,
          stock_quantity || 0,
          primaryImageUrl
        ]
      );
      const product = result.rows[0];
      
      const tableExists = await checkProductImagesTable(client);
      if (tableExists) {
        for (let i = 0; i < imageUrls.length; i++) {
          await client.query(
            'INSERT INTO inventory.product_images (product_id, image_url, is_primary, display_order) VALUES ($1, $2, $3, $4)',
            [product.id, imageUrls[i], i === 0, i]
          );
        }
      }

      await client.query('COMMIT');
      return await this.findById(product.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, productData) {
    const client = await pool.connect();
    try {
      console.log("[PRODUCT MODEL] Updating product with data:", productData);
      await client.query('BEGIN');
      
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Collect all image URLs if provided
      let primaryImageUrl = null;
      const tableExists = await checkProductImagesTable(client);
      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        primaryImageUrl = productData.images[0];
        // Try to delete existing images if table exists
        if (tableExists) {
          await client.query('DELETE FROM inventory.product_images WHERE product_id = $1', [id]);
          
          // Try to insert new images
          for (let i = 0; i < productData.images.length; i++) {
            const img = productData.images[i];
            const url = typeof img === 'string' ? img : (img.url || img.image_url);
            if (url) {
              await client.query(
                'INSERT INTO inventory.product_images (product_id, image_url, is_primary, display_order) VALUES ($1, $2, $3, $4)',
                [id, url, i === 0, i]
              );
            }
          }
        }
      }

      // Define allowed columns for products table
      const allowedColumns = [
        'name', 'sku', 'description', 'category_id', 
        'is_active', 'expiration_date', 'stock_quantity', 'image_url',
        'barcode', 'weight_class', 'expiration_class', 'size_class',
        'price', 'cost', 'min_stock_level'
      ];

      for (const [key, value] of Object.entries(productData)) {
        if (value !== undefined && key !== 'id' && key !== 'images' && allowedColumns.includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      // Update image_url in products table
      if (primaryImageUrl !== null) {
        fields.push(`image_url = $${paramCount}`);
        values.push(primaryImageUrl);
        paramCount++;
      }

      values.push(id);

      console.log("[PRODUCT MODEL] Updating product ID:", id);
      console.log("[PRODUCT MODEL] Fields to update:", fields);
      console.log("[PRODUCT MODEL] Values:", values);

      let result;
      if (fields.length > 0) {
        result = await client.query(
          `UPDATE inventory.products SET ${fields.join(', ')}, updated_at = NOW() 
           WHERE id = $${paramCount} AND is_active = true 
           RETURNING *`,
          values
        );
      } else {
        result = await client.query(
          `UPDATE inventory.products SET updated_at = NOW() 
           WHERE id = $1 AND is_active = true 
           RETURNING *`,
          [id]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      console.error("[PRODUCT MODEL] Error updating product:", error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    await pool.query(
      'UPDATE inventory.products SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async list(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM inventory.products p 
      LEFT JOIN inventory.categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const values = [];
    let paramCount = 1;

    if (filters.category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      values.push(filters.category_id);
      paramCount++;
    }

    query += ` ORDER BY p.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const products = result.rows;
    
    // Get images for all products if table exists
    const tableExists = await checkProductImagesTable();
    if (tableExists && products.length > 0) {
      try {
        const productIds = products.map(p => p.id);
        const imagesResult = await pool.query(
          'SELECT * FROM inventory.product_images WHERE product_id = ANY($1) ORDER BY product_id, display_order, created_at',
          [productIds]
        );
        
        // Group images by product_id
        const imagesByProduct = {};
        imagesResult.rows.forEach(img => {
          if (!imagesByProduct[img.product_id]) {
            imagesByProduct[img.product_id] = [];
          }
          imagesByProduct[img.product_id].push(img);
        });
        
        // Add images to each product
        products.forEach(product => {
          product.images = imagesByProduct[product.id] || [];
        });
      } catch (err) {
        // If product_images table doesn't exist, set images as empty array for all products
        products.forEach(product => {
          product.images = [];
        });
      }
    } else {
      products.forEach(product => {
        product.images = [];
      });
    }
    
    return products;
  },

  async getTotalStock(productId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) as total_stock
       FROM inventory.stock
       WHERE product_id = $1`,
      [productId]
    );
    return result.rows[0]?.total_stock || 0;
  },

  async getExpiring(daysAhead = 30) {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM inventory.products p 
       LEFT JOIN inventory.categories c ON p.category_id = c.id 
       WHERE p.is_active = true 
         AND p.expiration_date IS NOT NULL 
         AND p.expiration_date >= CURRENT_DATE 
         AND p.expiration_date <= CURRENT_DATE + CAST($1 AS INTEGER)
       ORDER BY p.expiration_date ASC`,
      [daysAhead]
    );
    return result.rows;
  },
};

module.exports = {
  pool,
  Product,
};
