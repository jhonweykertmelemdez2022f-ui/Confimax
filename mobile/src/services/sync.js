import { getDatabase } from './database';
import { inventoryAPI, salesAPI, customersAPI } from './api';

class VectorClock {
  constructor() {
    this.clock = {};
  }

  increment(entity) {
    this.clock[entity] = (this.clock[entity] || 0) + 1;
    return this.clock[entity];
  }

  merge(otherClock) {
    for (const entity in otherClock) {
      this.clock[entity] = Math.max(this.clock[entity] || 0, otherClock[entity]);
    }
  }

  happensBefore(otherClock) {
    for (const entity in otherClock) {
      if ((this.clock[entity] || 0) > otherClock[entity]) {
        return false;
      }
    }
    return true;
  }

  isConcurrent(otherClock) {
    return !this.happensBefore(otherClock) && !otherClock.happensBefore(this);
  }

  toJSON() {
    return JSON.stringify(this.clock);
  }

  static fromJSON(json) {
    const vc = new VectorClock();
    vc.clock = JSON.parse(json);
    return vc;
  }
}

const SyncService = {
  vectorClock: new VectorClock(),

  async syncAll() {
    const db = getDatabase();
    
    try {
      await this.syncProducts(db);
      await this.syncCustomers(db);
      await this.pushPendingChanges(db);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },

  async syncProducts(db) {
    try {
      const products = await inventoryAPI.getProducts({ limit: 100 });
      
      await db.write(async () => {
        const productsCollection = db.get('products');
        
        for (const product of products.data) {
          const existing = await productsCollection
            .query()
            .fetch()
            .then(ps => ps.find(p => p.serverId === product.id));

          if (existing) {
            if (product.version > existing.version) {
              await existing.update(record => {
                record.name = product.name;
                record.sku = product.sku;
                record.barcode = product.barcode;
                record.unitPrice = product.unit_price;
                record.stockQuantity = product.stock_quantity;
                record.version = product.version;
                record.synced = true;
              });
            }
          } else {
            await productsCollection.create(record => {
              record.serverId = product.id;
              record.name = product.name;
              record.sku = product.sku;
              record.barcode = product.barcode;
              record.description = product.description;
              record.categoryId = product.category_id;
              record.unitPrice = product.unit_price;
              record.costPrice = product.cost_price;
              record.stockQuantity = product.stock_quantity;
              record.minStockLevel = product.min_stock_level;
              record.expirationDate = product.expiration_date ? new Date(product.expiration_date).getTime() : null;
              record.imageUrl = product.image_url;
              record.version = product.version;
              record.synced = true;
            });
          }
        }
      });

      this.vectorClock.increment('products');
    } catch (error) {
      console.error('Failed to sync products:', error);
    }
  },

  async syncCustomers(db) {
    try {
      const customers = await customersAPI.getCustomers({ limit: 100 });
      
      await db.write(async () => {
        const customersCollection = db.get('customers');
        
        for (const customer of customers.data) {
          const existing = await customersCollection
            .query()
            .fetch()
            .then(cs => cs.find(c => c.serverId === customer.id));

          if (!existing) {
            await customersCollection.create(record => {
              record.serverId = customer.id;
              record.name = customer.name;
              record.rif = customer.rif;
              record.email = customer.email;
              record.phone = customer.phone;
              record.address = customer.address;
              record.creditLimit = customer.credit_limit;
              record.version = customer.version;
              record.synced = true;
            });
          }
        }
      });

      this.vectorClock.increment('customers');
    } catch (error) {
      console.error('Failed to sync customers:', error);
    }
  },

  async pushPendingChanges(db) {
    try {
      const queueCollection = db.get('sync_queue');
      const pending = await queueCollection.query().fetch();

      for (const item of pending) {
        try {
          await this.processQueueItem(item);
          
          await db.write(async () => {
            await item.destroyPermanently();
          });
        } catch (error) {
          console.error('Failed to process queue item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to push pending changes:', error);
    }
  },

  async processQueueItem(item) {
    const data = JSON.parse(item.data);
    
    switch (item.entityType) {
      case 'sale':
        await salesAPI.createSale(data);
        break;
      default:
        console.warn('Unknown entity type:', item.entityType);
    }
  },

  async queueChange(entityType, entityId, operation, data) {
    const db = getDatabase();
    
    await db.write(async () => {
      const queueCollection = db.get('sync_queue');
      await queueCollection.create(record => {
        record.entityType = entityType;
        record.entityId = entityId;
        record.operation = operation;
        record.data = JSON.stringify(data);
      });
    });
  },

  getVectorClock() {
    return this.vectorClock;
  },
};

export default SyncService;
export { VectorClock };
