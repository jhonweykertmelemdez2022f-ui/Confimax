import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {salesAPI, inventoryAPI, customersAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, User, Search, Trash2, Plus, Minus, Tag, CreditCard, UserPlus, X } from 'lucide-react-native';

const VAT_RATE = 0.16; // 16% VAT

function NewSaleScreen({route, navigation}) {
  const initialItem = route.params?.initialItem;
  
  // Customer states
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Product states
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Sale states
  const [cart, setCart] = useState([]); // Stores { product, quantity, discount }
  const [discount, setDiscount] = useState(0); // Overall sale discount
  const [loading, setLoading] = useState(false);
  
  const {colors, spacing, borderRadius, typography} = useTheme();

  // Handle initial item from route params
  useEffect(() => {
    if (initialItem) {
      setCart([{ 
        product: initialItem.product, 
        quantity: initialItem.quantity || 1, 
        discount: 0 
      }]);
    }
  }, [initialItem]);

  // Debounce customer search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (customerSearchQuery.length > 2) {
        handleSearchCustomers(customerSearchQuery);
      } else {
        setCustomerResults([]);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [customerSearchQuery]);

  // Debounce product search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (productSearchQuery.length > 2) {
        handleSearchProducts(productSearchQuery);
      } else {
        setProductResults([]);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [productSearchQuery]);

  const handleSearchCustomers = async (query) => {
    setSearchingCustomers(true);
    try {
      const response = await customersAPI.searchCustomers(query);
      setCustomerResults(response.data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const handleSearchProducts = async (query) => {
    setSearchingProducts(true);
    try {
      const response = await inventoryAPI.searchProductsABC(query);
      setProductResults(response.data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setCustomerResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
  };

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1, discount: 0 }];
      }
    });
    setProductSearchQuery('');
    setProductResults([]);
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

  const calculateTotals = () => {
    let subtotal = cart.reduce((sum, item) => {
      const price = item.product.unitPrice || item.product.unit_price || item.product.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    let itemDiscountsTotal = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
    let totalDiscount = discount + itemDiscountsTotal;
    let taxableBase = Math.max(0, subtotal - totalDiscount);
    const ivaAmount = taxableBase * VAT_RATE;
    const total = taxableBase + ivaAmount;

    return { subtotal, totalDiscount, ivaAmount, total };
  };

  const { subtotal, totalDiscount, ivaAmount, total } = calculateTotals();

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Por favor, agrega productos a la venta.');
      return;
    }

    setLoading(true);
    try {
      await salesAPI.createSale({ 
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name, 
        discount: totalDiscount, // Match backend model field name
        status: 'pendiente',
        items: cart.map(item => {
          const price = item.product.unitPrice || item.product.unit_price || item.product.price || 0;
          return {
            product_id: item.product.id,
            sku: item.product.sku,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: price,
            discount: item.discount || 0,
          };
        }),
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

  const dynamicStyles = createStyles(colors, spacing, borderRadius, typography);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>REGISTRO DE VENTA</Text>
        </View>

        {/* Customer Selection Card */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.inputGroup}>
            <View style={dynamicStyles.labelRow}>
              <User size={16} color={colors.primary} />
              <Text style={dynamicStyles.label}>CLIENTE (BUSCADOR)</Text>
              {!selectedCustomer && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('NewCustomer')}
                  style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <UserPlus size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: 'bold' }}>NUEVO</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {!selectedCustomer ? (
              <View style={dynamicStyles.searchContainer}>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Buscar por nombre o email..."
                  placeholderTextColor={colors.muted + '80'}
                  value={customerSearchQuery}
                  onChangeText={setCustomerSearchQuery}
                />
                {searchingCustomers && <ActivityIndicator size="small" color={colors.primary} style={dynamicStyles.searchLoader} />}
              </View>
            ) : (
              <View style={dynamicStyles.selectedCustomerContainer}>
                <View style={dynamicStyles.customerAvatar}>
                  <Text style={dynamicStyles.avatarText}>{selectedCustomer.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={dynamicStyles.selectedCustomerName}>{selectedCustomer.name}</Text>
                  <Text style={dynamicStyles.selectedCustomerEmail}>{selectedCustomer.email || 'Sin email'}</Text>
                </View>
                <TouchableOpacity onPress={handleClearCustomer} style={dynamicStyles.clearCustomerBtn}>
                  <X size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}

            {customerResults.length > 0 && !selectedCustomer && (
              <View style={dynamicStyles.searchResultsContainer}>
                {customerResults.map((customer) => (
                  <TouchableOpacity 
                    key={customer.id} 
                    style={dynamicStyles.searchResultItem}
                    onPress={() => handleSelectCustomer(customer)}
                  >
                    <UserPlus size={18} color={colors.primary} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={dynamicStyles.searchResultItemText}>{customer.name}</Text>
                      <Text style={dynamicStyles.searchResultItemSubtext}>{customer.email || 'N/A'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <View style={dynamicStyles.labelRow}>
              <Search size={16} color={colors.primary} />
              <Text style={dynamicStyles.label}>AÑADIR PRODUCTOS</Text>
            </View>
            <View style={dynamicStyles.searchContainer}>
              <TextInput
                style={dynamicStyles.input}
                placeholder="Nombre o SKU..."
                placeholderTextColor={colors.muted + '80'}
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
              />
              {searchingProducts && <ActivityIndicator size="small" color={colors.primary} style={dynamicStyles.searchLoader} />}
            </View>
          </View>

          {productResults.length > 0 && (
            <View style={dynamicStyles.searchResultsContainer}>
              {productResults.map((item) => {
                const price = item.unitPrice || item.unit_price || item.price || 0;
                return (
                  <TouchableOpacity 
                    key={item.id}
                    style={dynamicStyles.searchResultItem}
                    onPress={() => handleAddToCart(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={dynamicStyles.searchResultItemText}>{item.name}</Text>
                      <Text style={dynamicStyles.searchResultItemPrice}>${Number(price).toFixed(2)}</Text>
                    </View>
                    <Plus size={24} color={colors.primary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Cart Section */}
        {cart.length > 0 && (
          <View style={dynamicStyles.cartSection}>
            <View style={dynamicStyles.sectionHeader}>
              <ShoppingCart size={20} color={colors.primary} />
              <Text style={dynamicStyles.sectionTitle}>CARRITO DE COMPRAS</Text>
              <View style={dynamicStyles.badge}>
                <Text style={dynamicStyles.badgeText}>{cart.length}</Text>
              </View>
            </View>
            
            {cart.map((item) => {
              const price = item.product.unitPrice || item.product.unit_price || item.product.price || 0;
              return (
                <View key={item.product.id} style={dynamicStyles.cartItem}>
                  <View style={dynamicStyles.cartItemDetails}>
                    <Text style={dynamicStyles.cartItemName}>{item.product.name}</Text>
                    <Text style={dynamicStyles.cartItemPrice}>${Number(price).toFixed(2)} c/u</Text>
                    
                    <View style={dynamicStyles.discountRow}>
                      <Tag size={12} color={colors.muted} />
                      <TextInput
                        style={dynamicStyles.itemDiscountInput}
                        placeholder="Desc. ($)"
                        placeholderTextColor={colors.muted + '80'}
                        value={item.discount ? item.discount.toString() : ''}
                        onChangeText={(text) => handleItemDiscountChange(item.product.id, parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View style={dynamicStyles.cartItemActions}>
                    <View style={dynamicStyles.quantityControl}>
                      <TouchableOpacity 
                        style={dynamicStyles.qtyBtn}
                        onPress={() => handleChangeQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={dynamicStyles.cartItemQuantity}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={dynamicStyles.qtyBtn}
                        onPress={() => handleChangeQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFromCart(item.product.id)} style={dynamicStyles.deleteBtn}>
                      <Trash2 size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Summary Card */}
        <View style={dynamicStyles.summaryCard}>
          <View style={dynamicStyles.inputGroup}>
            <View style={dynamicStyles.labelRow}>
              <CreditCard size={16} color={colors.primary} />
              <Text style={dynamicStyles.label}>DESCUENTO GLOBAL ($)</Text>
            </View>
            <TextInput
              style={dynamicStyles.input}
              placeholder="0.00"
              placeholderTextColor={colors.muted + '80'}
              value={discount === 0 ? '' : discount.toString()}
              onChangeText={(text) => setDiscount(parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={dynamicStyles.totalsContainer}>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>SUBTOTAL</Text>
              <Text style={dynamicStyles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>DESCUENTO</Text>
              <Text style={[dynamicStyles.summaryValue, { color: colors.error }]}>-${totalDiscount.toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.summaryRow}>
              <Text style={dynamicStyles.summaryLabel}>IMPUESTO (16% IVA)</Text>
              <Text style={dynamicStyles.summaryValue}>${ivaAmount.toFixed(2)}</Text>
            </View>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={dynamicStyles.totalRow}
            >
              <Text style={dynamicStyles.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={dynamicStyles.totalValue}>${total.toFixed(2)}</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity 
            style={[dynamicStyles.saveButton, (loading || cart.length === 0) && dynamicStyles.disabledButton]} 
            onPress={handleSave}
            disabled={loading || cart.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={dynamicStyles.saveButtonText}>CONFIRMAR VENTA</Text>
                <MaterialIcons name="check-circle" size={24} color="#ffffff" style={{marginLeft: 8}} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors, spacing, borderRadius, typography) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchLoader: {
    position: 'absolute',
    right: 15,
  },
  input: {
    height: 52,
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  selectedCustomerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  selectedCustomerEmail: {
    fontSize: 12,
    color: colors.muted,
  },
  clearCustomerBtn: {
    padding: 8,
  },
  searchResultsContainer: {
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    maxHeight: 200,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  searchResultItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  searchResultItemSubtext: {
    fontSize: 12,
    color: colors.muted,
  },
  searchResultItemPrice: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cartSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemDiscountInput: {
    fontSize: 13,
    color: colors.error,
    padding: 0,
    fontWeight: '600',
    width: 80,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  qtyBtn: {
    padding: 8,
  },
  cartItemQuantity: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.onSurface,
    minWidth: 25,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 5,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  totalsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.9,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  saveButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default NewSaleScreen;


