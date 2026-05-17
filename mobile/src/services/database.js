import AsyncStorage from '@react-native-async-storage/async-storage';

// Lightweight AsyncStorage-based database for Expo Go compatibility
// WatermelonDB requires native compilation and cannot run in Expo Go

const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },
};

export const initializeDatabase = async () => {
  console.log('Database (AsyncStorage) initialized');
  return storage;
};

export const getDatabase = () => storage;

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
    return { products: 0, customers: 0, sales: 0 };
  },
  updateVectorClock(entity, version) {
    console.log(`Updated ${entity} to version ${version}`);
  },
};

export default storage;
