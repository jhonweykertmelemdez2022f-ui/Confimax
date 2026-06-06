import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export const PdfButton = ({ onPress, style, size = 24, iconSize, accessibilityLabel = 'Exportar PDF' }) => {
  const { colors } = useTheme();
  const iconSizeValue = iconSize || size;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons name="picture-as-pdf" size={iconSizeValue} color={colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
