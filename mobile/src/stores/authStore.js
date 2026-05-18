import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

// Simple mock SyncService - no native DB required for Expo Go
const SyncService = {
  syncAll: async () => {
    console.log('Sync skipped in Expo Go mode');
  },
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ username, password });
      const { user, accessToken, refreshToken } = response.data;

      // Guardar tokens de autenticación
      await SecureStore.setItemAsync(
        'confimax_auth',
        JSON.stringify({ token: accessToken, refreshToken })
      );

      // Guardar credenciales de forma encriptada para el Login Biométrico
      await SecureStore.setItemAsync(
        'confimax_credentials',
        JSON.stringify({ username, password })
      );

      set({ user, token: accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      await SyncService.syncAll();
      return true;
    } catch (error) {
      console.error('🔴 Error de Login en móvil:', error);
      if (error.response) {
        console.error('🔴 Respuesta de error del Servidor:', error.response.status, error.response.data);
      }
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register({ name: username, username, email, password, role: 'customer' });
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('🔴 Error de Registro en móvil:', error);
      if (error.response) {
        console.error('🔴 Respuesta de error del Servidor:', error.response.status, error.response.data);
      }
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = get();
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    await SecureStore.deleteItemAsync('confimax_auth');
    await SecureStore.deleteItemAsync('confimax_credentials');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  refreshAuth: async () => {
    try {
      const { refreshToken } = get();
      if (!refreshToken) return false;

      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken } = response.data;

      const stored = JSON.parse(await SecureStore.getItemAsync('confimax_auth') || '{}');
      stored.token = accessToken;
      await SecureStore.setItemAsync('confimax_auth', JSON.stringify(stored));

      set({ token: accessToken });
      return true;
    } catch (error) {
      get().logout();
      return false;
    }
  },

  updateUser: (newData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...newData } : null
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

