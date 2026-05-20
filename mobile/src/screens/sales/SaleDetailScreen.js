import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {salesAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

function SaleDetailScreen({route, navigation}) {
  const {id} = route.params;
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const {colors} = useTheme();
  const {user} = useAuthStore();

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      const response = await salesAPI.getSale(id);
      if (response.data) {
        setSale(response.data);
      } else {
        setSale(null);
      }
    } catch (error) {
      console.log('Error fetching sale from backend:', error);
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = () => {
    Alert.alert(
      'Anular Venta',
      '¿Estás seguro de que deseas anular esta venta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Anular Venta', 
          style: 'destructive',
          onPress: async () => {
            try {
              await salesAPI.deleteSale(id);
              Alert.alert('Éxito', 'La venta ha sido anulada exitosamente.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo anular la venta.');
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = createStyles(colors);

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.dataBlue} />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={dynamicStyles.center}>
        <MaterialIcons name="error-outline" size={60} color={colors.secondary} />
        <Text style={dynamicStyles.notFoundText}>Venta no encontrada</Text>
        <Text style={dynamicStyles.notFoundSub}>El comprobante de transacción seleccionado no existe.</Text>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={dynamicStyles.backButtonText}>VOLVER A VENTAS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <MaterialIcons name="receipt-long" size={80} color={colors.dataBlue} />
        <Text style={dynamicStyles.title}>VENTA #{sale.id}</Text>
        <Text style={dynamicStyles.date}>
          {sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/D'}
        </Text>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>CLIENTE FACTURADO</Text>
        <View style={dynamicStyles.customerRow}>
          <MaterialIcons name="person" size={20} color={colors.secondary} style={{marginRight: 8}} />
          <Text style={dynamicStyles.customerName}>{sale.customer_name || 'Cliente general'}</Text>
        </View>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>DETALLE DE LA COMPRA</Text>
        {(sale.items || []).map((item, index) => (
          <View key={index} style={dynamicStyles.itemRow}>
            <View style={dynamicStyles.itemLeft}>
              <Text style={dynamicStyles.itemQty}>{item.qty}x</Text>
              <Text style={dynamicStyles.itemName}>{item.name}</Text>
            </View>
            <Text style={dynamicStyles.itemPrice}>${item.price}</Text>
          </View>
        ))}

        <View style={dynamicStyles.divider} />

        <View style={dynamicStyles.totalRow}>
          <Text style={dynamicStyles.totalLabel}>TOTAL TRANSACCIÓN</Text>
          <Text style={dynamicStyles.totalAmount}>${sale.total}</Text>
        </View>
      </View>

      <View style={{ marginTop: 10, marginBottom: 30, marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity 
          style={[dynamicStyles.actionButton, { flex: 1, marginRight: 5, backgroundColor: colors.dataBlue, marginTop: 0, marginHorizontal: 0 }]}
          onPress={() => Alert.alert('Éxito', 'Comprobante enviado')}>
          <MaterialIcons name="share" size={20} color="#ffffff" style={{marginRight: 8}} />
          <Text style={dynamicStyles.actionButtonText}>COMPARTIR</Text>
        </TouchableOpacity>

        {user?.role !== 'customer' && (
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, { flex: 1, marginLeft: 5, backgroundColor: colors.error, marginTop: 0, marginHorizontal: 0 }]}
            onPress={handleDeleteSale}>
            <MaterialIcons name="delete" size={20} color="#ffffff" style={{marginRight: 8}} />
            <Text style={dynamicStyles.actionButtonText}>ANULAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    padding: 30,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 15,
  },
  notFoundSub: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },
  backButton: {
    backgroundColor: colors.borderMuted,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 15,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 6,
  },
  section: {
    padding: 20,
    backgroundColor: colors.surface,
    margin: 15,
    marginBottom: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 14,
    color: colors.dataBlue,
    fontWeight: 'bold',
    marginRight: 10,
  },
  itemName: {
    fontSize: 15,
    color: colors.primary,
  },
  itemPrice: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 24,
    color: colors.dataBlue,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dataBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default SaleDetailScreen;
