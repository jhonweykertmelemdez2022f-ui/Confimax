import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
  AsyncStorage,
} from 'react-native';
import {inventoryAPI, notificationsAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as notificationService from '../../services/notificationService';
import { generateReportPDF } from '../../utils/pdfGenerator';

function ProductsScreen({navigation}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const {colors} = useTheme();
  const {user} = useAuthStore();
  const isFocused = useIsFocused();
  const notifiedProductsRef = useRef(new Set());

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await notificationService.registerForPushNotificationsAsync();
      if (token && user?.id) {
        try {
          await notificationsAPI.updateSettings(user.id, { push_token: token });
        } catch (error) {
          console.log('Error updating push token on server:', error);
        }
      }
    };
    setupNotifications();
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      loadProducts();
    }
  }, [isFocused]);

  const isProductExpiringSoon = (product) => {
    if (!product.expiration_date) return false;
    const today = new Date();
    const expiry = new Date(product.expiration_date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isStockLow = (product) => {
    const stock = parseInt(product.stock_quantity || product.stock || 0);
    const minStock = parseInt(product.min_stock_level || 10);
    return stock <= minStock;
  };

  const checkAlerts = (productsList) => {
    productsList.forEach(product => {
      // Ignorar productos inactivos
      if (product.is_active === false || product.active === false) return;

      // Alerta de Expiración
      if (isProductExpiringSoon(product) && !notifiedProductsRef.current.has(`${product.id}-exp`)) {
        const expiryDate = new Date(product.expiration_date).toLocaleDateString('es-ES');
        notificationService.sendImmediateNotification(
          '⚠️ Producto próximo a vencer',
          `${product.name} vence el ${expiryDate}`,
        );
        notifiedProductsRef.current.add(`${product.id}-exp`);
      }

      // Alerta de Stock Bajo
      if (isStockLow(product) && !notifiedProductsRef.current.has(`${product.id}-stock`)) {
        notificationService.sendImmediateNotification(
          '📉 Alerta de Stock Bajo',
          `El producto "${product.name}" tiene solo ${product.stock_quantity || 0} unidades restantes.`,
        );
        notifiedProductsRef.current.add(`${product.id}-stock`);
      }
    });
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryAPI.getProducts();
      const productsList = response.data || [];
      setProducts(productsList);
      checkAlerts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const generateQrData = (product) => {
    return JSON.stringify({
      type: 'product',
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
    });
  };

  const generateAllQRsPdf = async () => {
    if (products.length === 0) {
      Alert.alert('Aviso', 'No hay productos para generar QR');
      return;
    }

    try {
      const productsHtml = products.map(product => `
        <div style="display: inline-block; width: 280px; margin: 15px; padding: 20px; border: 1px solid #ddd; border-radius: 10px; text-align: center;">
          <h2 style="font-size: 18px; margin-bottom: 5px;">${product.name}</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">SKU: ${product.sku}</p>
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">$${product.price}</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateQrData(product))}" alt="QR" />
        </div>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>QRs de Todos los Productos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
            }
            .container {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <h1>QRs de Todos los Productos</h1>
          <div class="container">
            ${productsHtml}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir QRs de todos los productos',
        });
      } else {
        Alert.alert('Éxito', 'PDF generado en: ' + uri);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const exportPDF = async () => {
    const columns = [
      { label: 'Nombre', key: 'name' },
      { label: 'SKU', key: 'sku' },
      { label: 'Precio', key: 'price' },
      { label: 'Stock', key: 'stock_quantity' }
    ];
    // Map data to ensure numeric fields are correctly displayed
    const data = filteredProducts.map(p => ({
      ...p,
      price: `$${Number(p.unit_price || p.price || 0).toFixed(2)}`,
      stock_quantity: p.stock_quantity || p.stock || 0
    }));
    await generateReportPDF('Reporte General de Productos', columns, data);
  };

  const dynamicStyles = createStyles(colors);

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.searchBarContainer}>
        <MaterialIcons name="search" size={20} color={colors.muted} style={dynamicStyles.searchIcon} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar artículos..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={exportPDF} style={{ padding: 5 }}>
          <MaterialIcons name="picture-as-pdf" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.buttonsRow}>
        <TouchableOpacity 
          style={dynamicStyles.actionButton}
          onPress={() => navigation.navigate('QrScanner')}
        >
          <MaterialIcons name="qr-code-scanner" size={22} color={colors.onPrimary} />
          <Text style={dynamicStyles.actionButtonText}>Escanear QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={dynamicStyles.actionButton}
          onPress={generateAllQRsPdf}
        >
          <MaterialIcons name="picture-as-pdf" size={22} color={colors.onPrimary} />
          <Text style={dynamicStyles.actionButtonText}>Todos los QRs</Text>
        </TouchableOpacity>
        
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('Categories')}
          >
            <MaterialIcons name="category" size={22} color={colors.onPrimary} />
            <Text style={dynamicStyles.actionButtonText}>Categorías</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({item}) => {
          const isExpiring = isProductExpiringSoon(item);
          return (
            <TouchableOpacity
              style={dynamicStyles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            >
              {isExpiring && (
                <View style={dynamicStyles.expiryBadge}>
                  <MaterialIcons name="warning" size={16} color={colors.onError} />
                  <Text style={dynamicStyles.expiryText}>Próximo a vencer!</Text>
                </View>
              )}
              <View style={dynamicStyles.productCardContent}>
                <View style={dynamicStyles.productInfo}>
                  <Text style={dynamicStyles.productName}>{item.name}</Text>
                  <Text style={dynamicStyles.productSku}>SKU: {item.sku}</Text>
                </View>
                <View style={dynamicStyles.productPriceContainer}>
                  <Text style={dynamicStyles.productPrice}>
                    ${Number(item.unitPrice || item.unit_price || item.price || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
              {item.expiry_date && (
                <Text style={[dynamicStyles.expiryDate, isExpiring ? dynamicStyles.expiryDateUrgent : null]}>
                  Vence: {new Date(item.expiry_date).toLocaleDateString('es-ES')}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.id ? item.id.toString() : item.sku}
        contentContainerStyle={dynamicStyles.list}
      />

      {user?.role !== 'customer' && (
        <TouchableOpacity 
          style={dynamicStyles.fab}
          onPress={() => navigation.navigate('NewProduct')}
        >
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
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
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.onSurface,
    fontSize: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  list: {
    padding: 15,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productSku: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  productPriceContainer: {
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  expiryBadge: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  expiryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  productPrice: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '800',
  },
  expiryDate: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  expiryDateUrgent: {
    color: colors.error,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductsScreen;
