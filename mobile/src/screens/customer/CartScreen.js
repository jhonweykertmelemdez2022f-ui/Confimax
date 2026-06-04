import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useCartStore } from '../../stores/cartStore';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

function CartScreen({navigation}) {
  const {colors} = useTheme();
  const dynamicStyles = createStyles(colors);
  
  const items = useCartStore((state) => state.items);
  const checkout = useCartStore((state) => state.checkout);
  const isCheckingOut = useCartStore((state) => state.isCheckingOut);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const removeItem = useCartStore((state) => state.removeItem);

  const [isPaymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [paymentData, setPaymentData] = React.useState({ method: 'transfer', reference: '' });

  const handleOpenPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const handleCheckout = async () => {
    if (paymentData.method !== 'cash' && !paymentData.reference.trim()) {
      Alert.alert('Error', 'Por favor ingresa el número de referencia del pago.');
      return;
    }
    
    setPaymentModalVisible(false);
    
    try {
      const order = await checkout(paymentData);
      Alert.alert('Éxito', '¡Compra realizada con éxito! Generando comprobante...');
      
      try {
        await generateInvoicePDF(order);
      } catch (pdfError) {
        console.error("Error al generar PDF:", pdfError);
        Alert.alert('Aviso', 'La compra fue exitosa pero hubo un error al generar la factura.');
      }
      
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
              onPress={handleOpenPaymentModal}
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

      {/* Modal de Pago */}
      <Modal visible={isPaymentModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={dynamicStyles.modalContainer}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Confirmar Pago</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialIcons name="close" size={28} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={dynamicStyles.modalLabel}>Método de Pago</Text>
            <View style={dynamicStyles.methodsContainer}>
              {['transfer', 'paypal', 'cash', 'card'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    dynamicStyles.methodButton,
                    paymentData.method === method && dynamicStyles.methodButtonActive
                  ]}
                  onPress={() => setPaymentData({ ...paymentData, method })}
                >
                  <Text style={[
                    dynamicStyles.methodText,
                    paymentData.method === method && dynamicStyles.methodTextActive
                  ]}>
                    {method === 'transfer' ? 'Transferencia/Zelle' :
                     method === 'paypal' ? 'PayPal' :
                     method === 'card' ? 'Tarjeta' : 'Efectivo'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentData.method !== 'cash' && (
              <>
                <Text style={dynamicStyles.modalLabel}>Número de Referencia</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej. 1234567890"
                  value={paymentData.reference}
                  onChangeText={(text) => setPaymentData({ ...paymentData, reference: text })}
                  placeholderTextColor={colors.secondary}
                />
              </>
            )}

            <TouchableOpacity 
              style={[dynamicStyles.checkoutButton, { marginTop: 20 }]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
            >
              <Text style={dynamicStyles.checkoutButtonText}>
                {isCheckingOut ? 'PROCESANDO...' : 'CONFIRMAR Y COMPRAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 10,
    marginTop: 15,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceDim,
  },
  methodButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  methodText: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: colors.surfaceDim,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    color: colors.onSurface,
    fontSize: 16,
  },
});

export default CartScreen;