import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useCartStore } from '../../stores/cartStore';

function CartScreen({navigation}) {
  const {colors} = useTheme();
  const dynamicStyles = createStyles(colors);
  
  const items = useCartStore((state) => state.items);
  const checkout = useCartStore((state) => state.checkout);
  const isCheckingOut = useCartStore((state) => state.isCheckingOut);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const removeItem = useCartStore((state) => state.removeItem);

  const handleCheckout = async () => {
    try {
      await checkout();
      Alert.alert('Éxito', '¡Compra realizada con éxito!');
      navigation.navigate('Inicio');
    } catch (error) {
      Alert.alert('Error', error.message || 'Hubo un error al procesar el pago.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={dynamicStyles.itemContainer}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={dynamicStyles.itemImage} />
      ) : (
        <View style={dynamicStyles.imagePlaceholder}>
          <MaterialIcons name="image-not-supported" size={24} color={colors.secondary} />
        </View>
      )}
      <View style={dynamicStyles.itemDetails}>
        <Text style={dynamicStyles.itemName}>{item.name}</Text>
        <Text style={dynamicStyles.itemPrice}>${(Number(item.price) || 0).toFixed(2)}</Text>
        <View style={dynamicStyles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
            <MaterialIcons name="remove-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={dynamicStyles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
            <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)} style={dynamicStyles.removeButton}>
        <MaterialIcons name="delete-outline" size={24} color={colors.error || '#d32f2f'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>CARRITO DE COMPRAS</Text>
      
      {items.length === 0 ? (
        <Text style={dynamicStyles.emptyCartText}>Tu carrito está vacío.</Text>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={dynamicStyles.listContent}
          />
          <View style={dynamicStyles.footer}>
            <Text style={dynamicStyles.totalText}>Total: ${getTotalPrice().toFixed(2)}</Text>
            <TouchableOpacity 
              style={[dynamicStyles.checkoutButton, isCheckingOut && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
            >
              <MaterialIcons name="shopping-cart-checkout" size={24} color="#ffffff" />
              <Text style={dynamicStyles.checkoutButtonText}>
                {isCheckingOut ? 'PROCESANDO...' : 'PROCEDER AL PAGO'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}


const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
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
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
    color: colors.onSurface,
  },
  removeButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    paddingTop: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 15,
    textAlign: 'right',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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