import { useThemeStore } from '../stores/themeStore';

export const darkColors = {
  surface: '#141313',
  surfaceDim: '#0A0A0A',
  surfaceBright: '#1d1d1d',
  surfaceVariant: '#353434',
  onSurface: '#e5e2e1',
  primary: '#ffffff',
  onPrimary: '#2f3131',
  secondary: '#c6c6c6',
  dataBlue: '#0066FF',
  accentPink: '#CC0597',
  borderMuted: '#262626',
  white20: 'rgba(255, 255, 255, 0.2)',
  white10: 'rgba(255, 255, 255, 0.1)',
  black: '#000000',
  error: '#ffb4ab',
};

export const lightColors = {
  surface: '#ffffff',
  surfaceDim: '#f3f4f6',
  surfaceBright: '#ffffff',
  surfaceVariant: '#e5e7eb',
  onSurface: '#1f2937',
  primary: '#111827',
  onPrimary: '#ffffff',
  secondary: '#4b5563',
  dataBlue: '#0066FF',
  accentPink: '#CC0597',
  borderMuted: '#e5e7eb',
  white20: 'rgba(0, 0, 0, 0.08)',
  white10: 'rgba(0, 0, 0, 0.04)',
  black: '#ffffff',
  error: '#dc2626',
};

export const typography = {
  headlineLg: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bodyMd: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  dataLabel: {
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dataValue: {
    fontSize: 14,
    lineHeight: 16,
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

// Hook de tema dinámico y súper reactivo
export const useTheme = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = isDark ? darkColors : lightColors;
  return { colors, typography, spacing, isDark };
};

export const theme = {
  colors: darkColors,
  typography,
  spacing,
};

export default theme;
