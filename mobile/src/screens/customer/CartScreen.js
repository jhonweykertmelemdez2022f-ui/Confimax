import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function CartScreen({navigation}) {
  const {colors} = useTheme();

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>CARRITO DE COMPRAS</Text>
      {/* Aquí irá la lógica y UI para mostrar los productos en el carrito */}
      <Text style={dynamicStyles.emptyCartText}>Tu carrito está vacío.</Text>
      <TouchableOpacity 
        style={dynamicStyles.checkoutButton}
        onPress={() => Alert.alert('Checkout', 'Funcionalidad de compra no implementada aún.')}
      >
        <MaterialIcons name="shopping-cart-checkout" size={24} color="#ffffff" />
        <Text style={dynamicStyles.checkoutButtonText}>PROCEDER AL PAGO</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyCartText: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 16,
    marginTop: 50,
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto', // Empuja el botón al final
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CartScreen;