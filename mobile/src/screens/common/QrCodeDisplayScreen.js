import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api'; // Assuming 'api' is the base axios instance

function QrCodeDisplayScreen({ route, navigation }) {
  const { type, id, title } = route.params; // type: 'product', 'sale', 'customer', 'user'
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { colors } = useTheme();

  // Set navigation options for the header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: title || `QR de ${type}`, // Use the passed title or a default
      // headerRight: () => (...) // Add any right-side buttons here if needed
    });
  }, [navigation, title, type]); // Depend on navigation, title, and type

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get(`/backend/qr/generate`, { params: { type, id } });
        if (response.data && response.data.qrCodeImage) {
          setQrCodeImage(response.data.qrCodeImage);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching QR code:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [type, id]);

  const onShare = async () => {
    if (qrCodeImage) {
      try {
        await Share.share({
          message: `Código QR para ${title || type} con ID: ${id}`, // iOS
          url: qrCodeImage, // Android
        });
      } catch (shareError) {
        console.error('Error sharing QR code:', shareError.message);
        Alert.alert('Error al compartir', 'No se pudo compartir el código QR.');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={60} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>Error al cargar el QR</Text>
            <Text style={[styles.errorSubText, { color: colors.secondary }]}>Inténtalo de nuevo más tarde.</Text>
          </View>
        ) : qrCodeImage ? (
          <Image source={{ uri: qrCodeImage }} style={styles.qrCodeImage} />
        ) : null}

        {qrCodeImage && (
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={onShare}>
            <MaterialIcons name="share" size={24} color={colors.onPrimary} style={{ marginRight: 10 }} />
            <Text style={[styles.shareButtonText, { color: colors.onPrimary }]}>Compartir QR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrCodeImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QrCodeDisplayScreen;
