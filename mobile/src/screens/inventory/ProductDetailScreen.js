import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api'; // <--- ADD THIS IMPORT

function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { colors } = useTheme();

  const isProductExpiringSoon = () => {
    if (!product.expiry_date) return false;
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isExpiring = isProductExpiringSoon();

  const handleDeleteProduct = useCallback(() => {
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
  }, [navigation, product, colors, handleDeleteProduct]);

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
