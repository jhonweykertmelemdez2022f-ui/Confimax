import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const LOCKOUT_KEY = 'confimax_lockout_state';
const LOCKOUT_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30000;

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
  failedLoginAttempts: 0,
  isLockedOut: false,
  lockoutExpiresAt: null,

  loadLockoutState: async () => {
    try {
      const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const expiresAt = Number(data.lockoutExpiresAt || 0);
      const now = Date.now();
      if (expiresAt && expiresAt > now) {
        set({
          failedLoginAttempts: Number(data.failedLoginAttempts || 0),
          isLockedOut: true,
          lockoutExpiresAt: expiresAt,
        });
      } else {
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
      }
    } catch (error) {
      console.error('Error loading lockout state:', error);
    }
  },

  saveLockoutState: async (failedLoginAttempts, lockoutExpiresAt) => {
    try {
      await SecureStore.setItemAsync(LOCKOUT_KEY, JSON.stringify({ failedLoginAttempts, lockoutExpiresAt }));
    } catch (error) {
      console.error('Error saving lockout state:', error);
    }
  },

  clearLockoutState: async () => {
    try {
      await SecureStore.deleteItemAsync(LOCKOUT_KEY);
    } catch (error) {
      console.error('Error clearing lockout state:', error);
    }
    set({ failedLoginAttempts: 0, isLockedOut: false, lockoutExpiresAt: null });
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const now = Date.now();
      if (state.isLockedOut && state.lockoutExpiresAt && state.lockoutExpiresAt > now) {
        const remaining = Math.ceil((state.lockoutExpiresAt - now) / 1000);
        set({ error: `Demasiados intentos fallidos. Intenta de nuevo en ${remaining} segundos.`, isLoading: false });
        return false;
      }

      const response = await authAPI.login({ username, password });
      const { user, accessToken, refreshToken, token } = response.data;
      const finalToken = accessToken || token;

      // Guardar tokens de autenticación
      await SecureStore.setItemAsync(
        'confimax_auth',
        JSON.stringify({ token: finalToken, refreshToken: refreshToken || null })
      );

      // Guardar credenciales de forma encriptada para el Login Biométrico
      await SecureStore.setItemAsync(
        'confimax_credentials',
        JSON.stringify({ username, password })
      );

      await get().clearLockoutState();

      set({ user, token: finalToken, refreshToken: refreshToken || null, isAuthenticated: true, isLoading: false });
      await SyncService.syncAll();
      return true;
    } catch (error) {
      console.error(' Error de Login en móvil:', error);
      if (error.response) {
        console.error(' Respuesta de error del Servidor:', error.response.status, error.response.data);
      }

      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Login failed';
      const isAuthError = status === 401 || status === 403 || /clave|contraseña|credencial|usuario|credenciales/i.test(message);

      if (isAuthError) {
        const state = get();
        const nextAttempts = state.failedLoginAttempts + 1;
        const lockoutExpiresAt = nextAttempts >= LOCKOUT_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;

        if (lockoutExpiresAt) {
          await get().saveLockoutState(nextAttempts, lockoutExpiresAt);
          set({
            failedLoginAttempts: nextAttempts,
            isLockedOut: true,
            lockoutExpiresAt,
            error: `Demasiados intentos fallidos. Bloqueado por ${LOCKOUT_DURATION_MS / 1000} segundos.`,
            isLoading: false,
          });
        } else {
          await get().saveLockoutState(nextAttempts, null);
          set({ failedLoginAttempts: nextAttempts, error: message, isLoading: false });
        }
      } else {
        set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      }

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
      console.error(' Error de Registro en móvil:', error);
      if (error.response) {
        console.error(' Respuesta de error del Servidor:', error.response.status, error.response.data);
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

