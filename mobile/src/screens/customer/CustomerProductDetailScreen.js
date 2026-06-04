import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Tag, Hash, ShoppingCart, Plus, Minus } from 'lucide-react-native';
import { useCartStore } from '../../stores/cartStore';

const { width } = Dimensions.get('window');

function CustomerProductDetailScreen({ route, navigation }) {
  const { product: initialProduct, id } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const { colors, spacing, borderRadius, typography } = useTheme();
  
  const addItem = useCartStore((state) => state.addItem);
  const isFocused = useIsFocused();

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const productId = initialProduct?.id || id;
      const response = await inventoryAPI.getProduct(productId);
      if (response.data) {
        setProduct(response.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el detalle del producto.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Ocurrió un error al obtener la información del producto.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [initialProduct, id, navigation]);

  useEffect(() => {
    if (isFocused) {
      loadProduct();
    }
  }, [isFocused, loadProduct]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceDim }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) return null;

  const displayPrice = product.unitPrice || product.unit_price || product.price || 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    Alert.alert('Añadido al Carrito', `${quantity} ${product.name} añadido(s) al carrito exitosamente.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Product Image Placeholder / Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.headerGradient}
        >
          <Package size={80} color={colors.onPrimary} style={{ opacity: 0.8 }} />
        </LinearGradient>

        <View style={[styles.contentContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.topInfo}>
            <Text style={[styles.productName, { color: colors.onSurface }]}>{product.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: colors.muted }]}>Precio Unitario</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>${Number(displayPrice).toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceDim }]}>
                <Hash size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>SKU / Código</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface }]}>{product.sku || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceDim }]}>
                <Tag size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Categoría</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface, textTransform: 'capitalize' }]}>{product.category || 'General'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceDim }]}>
                <Package size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Stock Disponible</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface }]}>{product.stock_quantity || product.stock || 0} unidades</Text>
              </View>
            </View>
          </View>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Descripción</Text>
              <Text style={[styles.descriptionText, { color: colors.onSurface, opacity: 0.7 }]}>{product.description}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.borderMuted, marginVertical: 20 }]} />

          {/* Quantity Selector */}
          <View style={styles.actionSection}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 15 }]}>Añadir al Carrito</Text>
            
            <View style={styles.quantityRow}>
              <View style={[styles.quantitySelector, { borderColor: colors.borderMuted }]}>
                <TouchableOpacity 
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.quantityBtn}
                >
                  <Minus size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: colors.onSurface }]}>{quantity}</Text>
                <TouchableOpacity 
                  onPress={() => setQuantity(quantity + 1)}
                  style={styles.quantityBtn}
                >
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.totalPrice, { color: colors.onSurface }]}>
                Total: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>${(displayPrice * quantity).toFixed(2)}</Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddToCart}
            >
              <ShoppingCart size={22} color={colors.onPrimary} />
              <Text style={[styles.addToCartText, { color: colors.onPrimary }]}>AÑADIR AL CARRITO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    paddingBottom: 40,
  },
  topInfo: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 15,
    opacity: 0.3,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 68) / 2,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionSection: {
    marginTop: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quantityBtn: {
    padding: 12,
    paddingHorizontal: 15,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    minWidth: 40,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 18,
  },
  addToCartBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default CustomerProductDetailScreen;