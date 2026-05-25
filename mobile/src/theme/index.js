import { useThemeStore } from '../stores/themeStore';

export const darkColors = {
  surface: '#111827',
  surfaceDim: '#0a0a0a',
  surfaceBright: '#1f2937',
  surfaceVariant: '#374151',
  onSurface: '#ffffff',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  onPrimary: '#ffffff',
  secondary: '#a78bfa',
  accent: '#f472b6',
  muted: '#ffffff',
  borderMuted: '#4b5563',
  white20: 'rgba(255, 255, 255, 0.12)',
  white10: 'rgba(255, 255, 255, 0.06)',
  black: '#000000',
  error: '#f87171',
};

export const lightColors = {
  surface: '#ffffff',
  surfaceDim: '#f9fafb',
  surfaceBright: '#ffffff',
  surfaceVariant: '#e5e7eb',
  onSurface: '#000000',
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  onPrimary: '#ffffff',
  secondary: '#7c3aed',
  accent: '#db2777',
  muted: '#000000',
  borderMuted: '#d1d5db',
  white20: 'rgba(0, 0, 0, 0.05)',
  white10: 'rgba(0, 0, 0, 0.03)',
  black: '#ffffff',
  error: '#dc2626',
};

export const typography = {
  headlineLg: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headlineMd: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bodyMd: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  page: 20,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

// Hook de tema dinámico y súper reactivo
export const useTheme = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = isDark ? darkColors : lightColors;
  return { colors, typography, spacing, borderRadius, isDark };
};

export const theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
};

export default theme;
