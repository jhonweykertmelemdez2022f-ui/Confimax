import Database from '@nozbe/watermelondb/Database';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { models } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'confimax',
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

const database = new Database({
  adapter,
  modelClasses: models,
});

export const initializeDatabase = async () => {
  try {
    await database.write(async () => {
      console.log('Database initialized');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
  return database;
};

export const getDatabase = () => database;

export const syncService = {
  async syncWithServer() {
    console.log('Syncing with server...');
  },

  async pushChanges() {
    console.log('Pushing local changes...');
  },

  async pullChanges() {
    console.log('Pulling remote changes...');
  },

  getVectorClock() {
    return {
      products: 0,
      customers: 0,
      sales: 0,
    };
  },

  updateVectorClock(entity, version) {
    console.log(`Updated ${entity} to version ${version}`);
  },
};

export default database;
