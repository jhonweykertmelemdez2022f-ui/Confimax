import { useThemeStore } from '../stores/themeStore';

export const darkColors = {
  surface: '#111827',
  surfaceDim: '#0a0a0a',
  surfaceBright: '#1f2937',
  surfaceVariant: '#374151',
  onSurface: '#e5e7eb',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  onPrimary: '#ffffff',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  muted: '#9ca3af',
  borderMuted: '#374151',
  white20: 'rgba(255, 255, 255, 0.1)',
  white10: 'rgba(255, 255, 255, 0.05)',
  black: '#000000',
  error: '#ef4444',
};

export const lightColors = {
  surface: '#ffffff',
  surfaceDim: '#f9fafb',
  surfaceBright: '#ffffff',
  surfaceVariant: '#f3f4f6',
  onSurface: '#1f2937',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  onPrimary: '#ffffff',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  muted: '#6b7280',
  borderMuted: '#e5e7eb',
  white20: 'rgba(0, 0, 0, 0.04)',
  white10: 'rgba(0, 0, 0, 0.02)',
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
