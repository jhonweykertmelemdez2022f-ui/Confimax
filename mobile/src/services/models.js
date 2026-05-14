import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export class Product extends Model {
  static table = 'products';

  static associations = {
    sale_items: { type: 'has_many', foreignKey: 'product_id' },
  };

  @field('server_id') serverId;
  @field('name') name;
  @field('sku') sku;
  @field('barcode') barcode;
  @field('description') description;
  @field('category_id') categoryId;
  @field('unit_price') unitPrice;
  @field('cost_price') costPrice;
  @field('stock_quantity') stockQuantity;
  @field('min_stock_level') minStockLevel;
  @field('expiration_date') expirationDate;
  @field('image_url') imageUrl;
  @field('version') version;
  @field('synced') synced;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class Customer extends Model {
  static table = 'customers';

  static associations = {
    sales: { type: 'has_many', foreignKey: 'customer_id' },
    credits: { type: 'has_many', foreignKey: 'customer_id' },
  };

  @field('server_id') serverId;
  @field('name') name;
  @field('rif') rif;
  @field('email') email;
  @field('phone') phone;
  @field('address') address;
  @field('credit_limit') creditLimit;
  @field('version') version;
  @field('synced') synced;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class Sale extends Model {
  static table = 'sales';

  static associations = {
    sale_items: { type: 'has_many', foreignKey: 'sale_id' },
  };

  @field('server_id') serverId;
  @field('customer_id') customerId;
  @field('vendor_id') vendorId;
  @field('subtotal') subtotal;
  @field('iva') iva;
  @field('total') total;
  @field('currency') currency;
  @field('status') status;
  @field('notes') notes;
  @field('version') version;
  @field('synced') synced;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('sale_items') saleItems;
}

export class SaleItem extends Model {
  static table = 'sale_items';

  @field('sale_id') saleId;
  @field('product_id') productId;
  @field('quantity') quantity;
  @field('unit_price') unitPrice;
  @field('total') total;
}

export class Credit extends Model {
  static table = 'credits';

  @field('server_id') serverId;
  @field('customer_id') customerId;
  @field('sale_id') saleId;
  @field('amount') amount;
  @field('balance') balance;
  @field('currency') currency;
  @field('status') status;
  @field('payment_due_date') paymentDueDate;
  @field('version') version;
  @field('synced') synced;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('entity_type') entityType;
  @field('entity_id') entityId;
  @field('operation') operation;
  @field('data') data;
  @readonly @date('created_at') createdAt;
}

export const models = [Product, Customer, Sale, SaleItem, Credit, SyncQueue];
