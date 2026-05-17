import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useThemeStore = create((set) => ({
  isDark: true, // Modo oscuro por defecto para mantener el look premium de Confimax

  toggleTheme: async () => {
    set((state) => {
      const nextMode = !state.isDark;
      AsyncStorage.setItem('confimax_theme_dark', JSON.stringify(nextMode))
        .catch(err => console.log('Error saving theme:', err));
      return { isDark: nextMode };
    });
  },

  loadPersistedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('confimax_theme_dark');
      if (saved !== null) {
        set({ isDark: JSON.parse(saved) });
      }
    } catch (error) {
      console.log('Error loading persisted theme:', error);
    }
  },
}));

export default useThemeStore;
