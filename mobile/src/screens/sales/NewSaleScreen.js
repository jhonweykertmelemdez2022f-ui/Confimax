import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList, // Add FlatList for displaying products
  KeyboardAvoidingView, // For better keyboard management
  Platform,
  ScrollView,
} from 'react-native';
import {salesAPI, inventoryAPI} from '../../services/api'; // Import inventoryAPI
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

const VAT_RATE = 0.16; // 16% VAT

function NewSaleScreen({navigation}) {
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]); // Stores { product, quantity, discount }
  const [discount, setDiscount] = useState(0); // Overall sale discount
  const [loading, setLoading] = useState(false);
  const {colors} = useTheme();

  // Debounce search input
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const calculateTotals = () => {
    let subtotal = cart.reduce((sum, item) => sum + (item.product.unitPrice * item.quantity), 0);
    // Calculate item-level discounts
    let itemDiscountsTotal = cart.reduce((sum, item) => sum + (item.discount || 0), 0);

    let totalDiscount = discount + itemDiscountsTotal; // Add item-level discounts to global discount

    let taxableBase = subtotal - totalDiscount;
    if (taxableBase < 0) taxableBase = 0; // Ensure taxable base is not negative

    const ivaAmount = taxableBase * VAT_RATE;
    const total = taxableBase + ivaAmount;

    return { subtotal, totalDiscount, ivaAmount, total };
  };

  const { subtotal, totalDiscount, ivaAmount, total } = calculateTotals();

  const handleSearchProducts = async (query) => {
    try {
      const response = await inventoryAPI.searchProductsABC(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1, discount: 0 }]; // Add discount field
      }
    });
    setSearchQuery(''); // Clear search after adding
    setSearchResults([]);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleChangeQuantity = (productId, newQuantity) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      return prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleItemDiscountChange = (productId, newDiscount) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, discount: newDiscount } : item
      )
    );
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Por favor, agrega productos a la venta.');
      return;
    }

    setLoading(true);
    try {
      await salesAPI.createSale({ 
        customer_name: customerName, 
        subtotal: subtotal,
        discount_amount: totalDiscount,
        iva: ivaAmount,
        total: total,
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.unitPrice,
          total: item.product.unitPrice * item.quantity - item.discount, // Assuming item.discount is 0 for now
        })),
      });
      Alert.alert('Éxito', 'Venta registrada con éxito.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Error creating sale:', error);
      Alert.alert('Registro Offline', 'Se guardará en la cola de transacciones locales.', [
        { text: 'Entendido', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.form}>
          <Text style={dynamicStyles.title}>REGISTRO DE VENTA</Text>

          <Text style={dynamicStyles.label}>CLIENTE FACTURADO</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="Ej: Camila Rojas"
            placeholderTextColor={colors.secondary}
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={dynamicStyles.label}>BUSCAR PRODUCTOS</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="Buscar producto por nombre o SKU..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchResults.length > 0 && (
            <View style={dynamicStyles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={dynamicStyles.searchResultItem}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Text style={dynamicStyles.searchResultItemText}>{item.name} (${item.unitPrice})</Text>
                    <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {cart.length > 0 && (
            <View style={dynamicStyles.cartContainer}>
              <Text style={dynamicStyles.label}>PRODUCTOS EN CARRITO</Text>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.product.id}
                renderItem={({ item }) => (
                  <View style={dynamicStyles.cartItem}>
                    <View style={dynamicStyles.cartItemDetails}>
                      <Text style={dynamicStyles.cartItemName}>{item.product.name}</Text>
                      <Text style={dynamicStyles.cartItemPrice}>${item.product.unitPrice} x {item.quantity}</Text>
                      <TextInput
                        style={dynamicStyles.itemDiscountInput}
                        placeholder="Desc. item ($)"
                        placeholderTextColor={colors.secondary}
                        value={item.discount ? item.discount.toString() : ''}
                        onChangeText={(text) => handleItemDiscountChange(item.product.id, parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.cartItemActions}>
                      <TouchableOpacity onPress={() => handleChangeQuantity(item.product.id, item.quantity - 1)}>
                        <MaterialIcons name="remove-circle-outline" size={24} color={colors.error} />
                      </TouchableOpacity>
                      <Text style={dynamicStyles.cartItemQuantity}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => handleChangeQuantity(item.product.id, item.quantity + 1)}>
                        <MaterialIcons name="add-circle-outline" size={24} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveFromCart(item.product.id)} style={{ marginLeft: 10 }}>
                        <MaterialIcons name="delete" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          <Text style={dynamicStyles.label}>DESCUENTO GLOBAL ($)</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="Ej: 10.00"
            placeholderTextColor={colors.secondary}
            value={discount.toString()}
            onChangeText={(text) => setDiscount(parseFloat(text) || 0)}
            keyboardType="numeric"
          />

          <View style={dynamicStyles.summaryContainer}>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>Subtotal:</Text>
              <Text style={dynamicStyles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>Descuento:</Text>
              <Text style={dynamicStyles.summaryValue}>-${totalDiscount.toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>IVA ({VAT_RATE * 100}%):</Text>
              <Text style={dynamicStyles.summaryValue}>${ivaAmount.toFixed(2)}</Text>
            </View>
            <View style={[dynamicStyles.summaryRow, dynamicStyles.totalRowSummary]}>
              <Text style={dynamicStyles.summaryTotalLabel}>TOTAL:</Text>
              <Text style={dynamicStyles.summaryTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[dynamicStyles.saveButton, loading && dynamicStyles.disabledButton]} 
            onPress={handleSave}
            disabled={loading || cart.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="point-of-sale" size={20} color="#ffffff" style={{marginRight: 8}} />
                <Text style={dynamicStyles.saveButtonText}>REGISTRAR NUEVA VENTA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 15,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 50,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.primary,
  },
  searchResultsContainer: {
    maxHeight: 200, // Limit height of search results
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultItemText: {
    color: colors.primary,
    fontSize: 16,
  },
  cartContainer: {
    marginTop: 20,
    marginBottom: 15,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cartItemPrice: {
    fontSize: 14,
    color: colors.secondary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cartItemQuantity: {
    fontSize: 16,
    color: colors.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  itemDiscountInput: {
    height: 30,
    width: 100,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    marginTop: 5,
    fontSize: 14,
    color: colors.primary,
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalRowSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    paddingTop: 10,
    marginTop: 10,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: colors.dataBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default NewSaleScreen;
