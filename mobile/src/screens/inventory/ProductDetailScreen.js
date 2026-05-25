import React from 'react';
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.surface }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 15 }}>
          <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.onSurface, textAlign: 'center' }}>Detalle del Producto</Text>
        <View style={{ width: 40 }} />
      </View>

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
