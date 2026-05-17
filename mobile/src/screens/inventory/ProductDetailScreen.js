import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

function ProductDetailScreen({route, navigation}) {
  const {id} = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const {colors} = useTheme();
  const {user} = useAuthStore();

  // Estados para Ajuste de Inventario Real
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [stockItem, setStockItem] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await inventoryAPI.getProduct(id);
      if (response.data) {
        setProduct(response.data);
        
        // Cargar registro de stock asociado
        const stockRes = await inventoryAPI.getProductStockItems(id);
        const items = stockRes.data || [];
        if (items.length > 0) {
          setStockItem(items[0]);
          setNewStock(items[0].quantity.toString());
        } else {
          setStockItem(null);
          setNewStock('0');
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.log('Error fetching product and stock details:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    const qtyInt = parseInt(newStock);
    if (isNaN(qtyInt) || qtyInt < 0) {
      Alert.alert('Valor Inválido', 'Por favor ingresa una cantidad entera válida mayor o igual a 0.');
      return;
    }

    setUpdatingStock(true);
    try {
      if (stockItem) {
        // Actualizar registro de stock existente
        await inventoryAPI.updateStockItem(stockItem.id, { quantity: qtyInt });
      } else {
        // Crear un nuevo registro de stock en almacén Principal
        await inventoryAPI.createStockItem({
          product_id: id,
          location: 'Principal',
          quantity: qtyInt,
        });
      }
      
      Alert.alert('Éxito', 'El stock de inventario ha sido actualizado correctamente.', [
        {
          text: 'Entendido',
          onPress: () => {
            setStockModalVisible(false);
            loadProduct(); // Recargar los detalles para ver el nuevo stock
          }
        }
      ]);
    } catch (error) {
      console.log('Error adjusting stock:', error);
      Alert.alert('Error', 'No se pudo guardar la modificación del inventario. Inténtalo de nuevo.');
    } finally {
      setUpdatingStock(false);
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

  if (!product) {
    return (
      <View style={dynamicStyles.center}>
        <MaterialIcons name="error-outline" size={60} color={colors.secondary} />
        <Text style={dynamicStyles.notFoundText}>Artículo no encontrado</Text>
        <Text style={dynamicStyles.notFoundSub}>El artículo seleccionado no existe en la base de datos.</Text>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={dynamicStyles.backButtonText}>VOLVER AL INVENTARIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <MaterialIcons name="inventory-2" size={80} color={colors.dataBlue} />
        <Text style={dynamicStyles.name}>{product.name}</Text>
        <Text style={dynamicStyles.sku}>SKU: {product.sku || 'N/D'}</Text>
      </View>

      <View style={dynamicStyles.infoSection}>
        <View style={dynamicStyles.gridRow}>
          <View style={dynamicStyles.gridCol}>
            <Text style={dynamicStyles.label}>PRECIO UNITARIO</Text>
            <Text style={dynamicStyles.price}>${product.price}</Text>
          </View>
          <View style={dynamicStyles.gridCol}>
            <Text style={dynamicStyles.label}>DISPONIBILIDAD</Text>
            <Text style={[dynamicStyles.stock, (product.stock || 0) < 10 ? dynamicStyles.lowStock : dynamicStyles.inStock]}>
              {product.stock || 0} UNIDADES
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.divider} />

        <Text style={dynamicStyles.label}>DESCRIPCIÓN DEL ARTÍCULO</Text>
        <Text style={dynamicStyles.description}>
          {product.description || 'Este artículo está completamente registrado en tu base de datos y disponible para ser añadido a transacciones, facturas y reportes Confimax.'}
        </Text>
      </View>

      {user?.role !== 'customer' && (
        <TouchableOpacity 
          style={dynamicStyles.actionButton}
          onPress={() => setStockModalVisible(true)}>
          <MaterialIcons name="edit" size={20} color="#ffffff" style={{marginRight: 8}} />
          <Text style={dynamicStyles.actionButtonText}>MODIFICAR INVENTARIO</Text>
        </TouchableOpacity>
      )}

      {/* Modal de Ajuste de Stock */}
      <Modal
        visible={stockModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>AJUSTAR STOCK</Text>
            <Text style={dynamicStyles.modalSub}>
              Establece la cantidad física disponible de "{product?.name}" en el almacén principal.
            </Text>

            <Text style={dynamicStyles.modalLabel}>UNIDADES EN STOCK</Text>
            <TextInput
              style={dynamicStyles.modalInput}
              value={newStock}
              onChangeText={setNewStock}
              keyboardType="numeric"
              placeholder="Ej: 150"
              placeholderTextColor={colors.secondary}
            />

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity 
                style={dynamicStyles.modalCancelButton}
                onPress={() => setStockModalVisible(false)}
                disabled={updatingStock}
              >
                <Text style={dynamicStyles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[dynamicStyles.modalSaveButton, updatingStock && dynamicStyles.disabledButton]}
                onPress={handleAdjustStock}
                disabled={updatingStock}
              >
                {updatingStock ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={dynamicStyles.modalSaveText}>CONFIRMAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  sku: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoSection: {
    padding: 24,
    backgroundColor: colors.surface,
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  price: {
    fontSize: 26,
    color: colors.dataBlue,
    fontWeight: 'bold',
  },
  stock: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inStock: {
    color: '#10B981',
  },
  lowStock: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: 20,
  },
  description: {
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    marginHorizontal: 15,
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
    letterSpacing: 0.5,
  },
  // Modal de Ajuste de Stock
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  modalCancelText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalSaveButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.dataBlue,
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
});

export default ProductDetailScreen;
