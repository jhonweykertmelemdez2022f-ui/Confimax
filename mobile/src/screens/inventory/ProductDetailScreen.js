import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';

function ProductDetailScreen({ route, navigation }) {
  const { product: initialProduct, id } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const { colors } = useTheme();

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
    if (!product) {
      loadProduct();
    }
  }, [product, loadProduct]);

  const isProductExpiringSoon = () => {
    if (!product || !product.expiry_date) return false;
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isExpiring = isProductExpiringSoon();

  const handleDeleteProduct = useCallback(() => {
    if (!product) return;
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que quieres eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await inventoryAPI.deleteProduct(product.id);
              Alert.alert("Éxito", "Producto eliminado correctamente.");
              navigation.goBack();
            } catch (error) {
              console.error("Error al eliminar producto:", error);
              Alert.alert("Error", "No se pudo eliminar el producto.");
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [product, navigation]);

  useEffect(() => {
    if (product) {
      navigation.setOptions({
        headerTitle: 'Detalle del Artículo',
        headerRight: () => (
          <View style={{ flexDirection: 'row', marginRight: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewProduct', { product: product })}
              style={{ marginLeft: 10 }}
            >
              <MaterialIcons name="edit" size={28} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteProduct}
              style={{ marginLeft: 10 }}
            >
              <MaterialIcons name="delete" size={28} color={colors.error} />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, product, colors, handleDeleteProduct]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceDim }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          {isExpiring && (
            <View style={{ flexDirection: 'row', backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15, gap: 8 }}>
              <MaterialIcons name="warning" size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>Próximo a vencer!</Text>
            </View>
          )}
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.onSurface, marginBottom: 8 }}>{product.name}</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 12 }}>SKU: {product.sku}</Text>
          {product.expiry_date && (
            <Text style={{ fontSize: 14, color: isExpiring ? colors.error : colors.muted, marginBottom: 20, fontWeight: isExpiring ? 'bold' : 'normal' }}>
              Fecha de vencimiento: {new Date(product.expiry_date).toLocaleDateString('es-ES')}
            </Text>
          )}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>Precio: ${product.price}</Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.onSurface, marginBottom: 20 }}>Código QR del Producto</Text>
          
          <TouchableOpacity 
            style={{ flexDirection: 'row', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8, alignItems: 'center' }}
            onPress={() => navigation.navigate('QrCodeDisplay', { type: 'product', id: product.id, title: `QR de ${product.name}` })}
          >
            <MaterialIcons name="qr-code" size={20} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: 'bold' }}>Ver Código QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default ProductDetailScreen;
