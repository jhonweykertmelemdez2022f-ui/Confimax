import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryAPI, salesAPI, customersAPI, authAPI } from '../../services/api';

function QrScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { colors } = useTheme();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceDim, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.onSurface }}>Solicitando permiso...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceDim, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="camera-alt" size={100} color={colors.muted} />
        <Text style={{ color: colors.onSurface, marginBottom: 20, textAlign: 'center', paddingHorizontal: 40 }}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 }}
          onPress={requestPermission}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: 'bold' }}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginTop: 20 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const qrData = JSON.parse(data);
      
      switch (qrData.type) {
        case 'product':
          if (qrData.id) {
            const response = await inventoryAPI.getProduct(qrData.id);
            if (response.data) {
              Alert.alert(
                'Producto encontrado',
                `${response.data.name}\nSKU: ${response.data.sku}\nPrecio: $${response.data.price}`,
                [
                  { text: 'Ver detalle', onPress: () => navigation.navigate('ProductDetail', { id: response.data.id }) },
                  { text: 'Escanear nuevamente', onPress: () => setScanned(false) }
                ]
              );
            } else {
              Alert.alert('Producto no encontrado', 'No se encontró un producto con el ID escaneado.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          }
          break;
        case 'sale':
          if (qrData.id) {
            const response = await salesAPI.getSale(qrData.id);
            if (response.data) {
              Alert.alert(
                'Venta encontrada',
                `Transacción #${response.data.id}\nTotal: $${response.data.total}\nCliente: ${response.data.customer_name || 'N/A'}`,
                [
                  { text: 'Ver detalle', onPress: () => navigation.navigate('SaleDetail', { id: response.data.id }) },
                  { text: 'Escanear nuevamente', onPress: () => setScanned(false) }
                ]
              );
            } else {
              Alert.alert('Venta no encontrada', 'No se encontró una venta con el ID escaneado.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          }
          break;
        case 'customer':
          if (qrData.id) {
            const response = await customersAPI.getCustomer(qrData.id);
            if (response.data) {
              Alert.alert(
                'Cliente encontrado',
                `Nombre: ${response.data.name}\nEmail: ${response.data.email || 'N/A'}\nTeléfono: ${response.data.phone || 'N/A'}`,
                [
                  { text: 'Ver detalle', onPress: () => navigation.navigate('CustomerDetail', { id: response.data.id }) },
                  { text: 'Escanear nuevamente', onPress: () => setScanned(false) }
                ]
              );
            } else {
              Alert.alert('Cliente no encontrado', 'No se encontró un cliente con el ID escaneado.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          }
          break;
        case 'user':
          if (qrData.id) {
            const response = await authAPI.me(qrData.id); // Assuming 'me' can get any user by ID if authorized
            if (response.data) {
              Alert.alert(
                'Usuario encontrado',
                `Username: ${response.data.username}\nEmail: ${response.data.email}\nRol: ${response.data.role}`,
                [
                  { text: 'Ver detalle', onPress: () => navigation.navigate('Profile', { id: response.data.id }) }, // Assuming a generic profile screen for any user
                  { text: 'Escanear nuevamente', onPress: () => setScanned(false) }
                ]
              );
            } else {
              Alert.alert('Usuario no encontrado', 'No se encontró un usuario con el ID escaneado.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
          }
          break;
        default:
          Alert.alert(
            'Tipo de QR desconocido',
            `No se puede validar el tipo de registro: ${qrData.type || 'N/A'}`,
            [{ text: 'OK', onPress: () => setScanned(false) }]
          );
          break;
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'QR Inválido',
        'El código QR no contiene datos válidos o no es un formato esperado.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.surfaceDim }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 15 }}>
          <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.onSurface }}>Escaneador QR</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ ...StyleSheet.absoluteFillObject }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {scanned && (
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 }}
          onPress={() => setScanned(false)}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: 'bold' }}>Escanear nuevamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default QrScannerScreen;
