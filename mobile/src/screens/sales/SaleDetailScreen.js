import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {salesAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

function SaleDetailScreen({route, navigation}) {
  const {id} = route.params;
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
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

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true);
      await generateInvoicePDF(sale);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF de la factura.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    const statusLabels = {
      'entregado': 'entregar',
      'cancelado': 'cancelar'
    };

    Alert.alert(
      'Confirmar Cambio',
      `¿Estás seguro de que deseas ${statusLabels[newStatus]} esta orden?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, confirmar', 
          onPress: async () => {
            try {
              setUpdating(true);
              await salesAPI.updateSale(id, { status: newStatus });
              Alert.alert('Éxito', `La orden ha sido marcada como ${newStatus}.`);
              loadSale();
            } catch (error) {
              console.error(`Error updating sale status to ${newStatus}:`, error);
              const errorMsg = error.response?.data?.message || `No se pudo actualizar a ${newStatus}.`;
              Alert.alert('Error', errorMsg);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregado': return '#00FF66';
      case 'pendiente': return '#FFB800';
      case 'cancelado': return colors.error;
      default: return colors.secondary;
    }
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
        <View style={[dynamicStyles.statusBadgeDetail, { backgroundColor: getStatusColor(sale.status) + '20', borderColor: getStatusColor(sale.status) }]}>
          <Text style={[dynamicStyles.statusTextDetail, { color: getStatusColor(sale.status) }]}>{sale.status?.toUpperCase()}</Text>
        </View>
        <MaterialIcons name="receipt-long" size={70} color={colors.dataBlue} />
        <Text style={dynamicStyles.title}>VENTA #{sale.order_number || sale.id.toString().substring(0, 8).toUpperCase()}</Text>
        <Text style={dynamicStyles.date}>
          {sale.created_at ? new Date(sale.created_at).toLocaleString() : 'N/D'}
        </Text>
      </View>

      {/* Controles de Estado */}
      {user?.role !== 'customer' && sale.status === 'pendiente' && (
        <View style={dynamicStyles.statusActions}>
          <Text style={dynamicStyles.label}>GESTIONAR ESTADO</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              disabled={updating}
              onPress={() => handleUpdateStatus('entregado')}
              style={[dynamicStyles.statusBtn, { backgroundColor: '#00FF6620', borderColor: '#00FF66' }]}
            >
              {updating ? <ActivityIndicator size="small" color="#00FF66" /> : <MaterialIcons name="check-circle" size={18} color="#00FF66" />}
              <Text style={[dynamicStyles.statusBtnText, { color: '#00FF66' }]}>ENTREGAR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              disabled={updating}
              onPress={() => handleUpdateStatus('cancelado')}
              style={[dynamicStyles.statusBtn, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
            >
              {updating ? <ActivityIndicator size="small" color={colors.error} /> : <MaterialIcons name="cancel" size={18} color={colors.error} />}
              <Text style={[dynamicStyles.statusBtnText, { color: colors.error }]}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              <Text style={dynamicStyles.itemQty}>{item.quantity || item.qty}x</Text>
              <Text style={dynamicStyles.itemName}>{item.product_name || item.name}</Text>
            </View>
            <Text style={dynamicStyles.itemPrice}>${item.unit_price || item.price}</Text>
          </View>
        ))}

        <View style={dynamicStyles.totalRow}>
          <Text style={dynamicStyles.totalLabel}>SUBTOTAL</Text>
          <Text style={dynamicStyles.totalAmount}>${Number(sale.subtotal || 0).toFixed(2)}</Text>
        </View>
        {sale.discount > 0 && (
          <View style={dynamicStyles.totalRow}>
            <Text style={dynamicStyles.totalLabel}>DESCUENTO</Text>
            <Text style={dynamicStyles.totalAmount}>-${Number(sale.discount || 0).toFixed(2)}</Text>
          </View>
        )}
        <View style={dynamicStyles.totalRow}>
          <Text style={dynamicStyles.totalLabel}>IVA</Text>
          <Text style={dynamicStyles.totalAmount}>${Number(sale.tax || sale.iva || 0).toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.divider} />

        <View style={dynamicStyles.totalRow}>
          <Text style={dynamicStyles.totalLabel}>TOTAL TRANSACCIÓN</Text>
          <Text style={dynamicStyles.totalAmount}>${Number(sale.total || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 10, marginBottom: 30, marginHorizontal: 15 }}>
        {/* Botón Principal: Generar Factura PDF */}
        <TouchableOpacity 
          style={[dynamicStyles.actionButton, { backgroundColor: colors.dataBlue || '#4f46e5', marginBottom: 10, marginHorizontal: 0 }]}
          onPress={handleGeneratePDF}
          disabled={generatingPdf}
        >
          {generatingPdf ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={22} color="#ffffff" style={{marginRight: 10}} />
              <Text style={dynamicStyles.actionButtonText}>MANDAR FACTURA (PDF)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[dynamicStyles.actionButton, { backgroundColor: colors.primary, marginBottom: 10, marginTop: 0, marginHorizontal: 0 }]}
          onPress={() => navigation.navigate('QrCodeDisplay', { type: 'sale', id: sale.id, title: `QR de Venta #${sale.id}` })}
        >
          <MaterialIcons name="qr-code" size={20} color={colors.onPrimary} style={{marginRight: 8}} />
          <Text style={dynamicStyles.actionButtonText}>VER CÓDIGO QR</Text>
        </TouchableOpacity>

        {user?.role !== 'customer' && (
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, { backgroundColor: colors.error, marginTop: 0, marginHorizontal: 0 }]}
            onPress={handleDeleteSale}>
            <MaterialIcons name="delete" size={20} color="#ffffff" style={{marginRight: 8}} />
            <Text style={dynamicStyles.actionButtonText}>ANULAR VENTA</Text>
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
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  statusBadgeDetail: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  statusTextDetail: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusActions: {
    padding: 20,
    backgroundColor: colors.surface,
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
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
