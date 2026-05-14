import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { authAPI } from '../services/api';
import SyncService from '../services/sync';

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

      await Keychain.setGenericPassword(
        JSON.stringify({ token: accessToken, refreshToken }),
        'confimax_auth'
      );

      set({ user, token: accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      
      await SyncService.syncAll();
      
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
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

    await Keychain.resetGenericPassword();
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  refreshAuth: async () => {
    try {
      const { refreshToken } = get();
      if (!refreshToken) return false;

      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken } = response.data;

      const credentials = await Keychain.getGenericPassword();
      const stored = JSON.parse(credentials.password);
      stored.token = accessToken;
      await Keychain.setGenericPassword(JSON.stringify(stored), 'confimax_auth');

      set({ token: accessToken });
      return true;
    } catch (error) {
      get().logout();
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
