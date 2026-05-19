import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {inventoryAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function NewProductScreen({navigation}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !sku || !price) {
      Alert.alert('Faltan Datos', 'Por favor, rellena todos los campos.');
      return;
    }

    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      Alert.alert('Valor Inválido', 'El precio debe ser un número mayor o igual a cero.');
      return;
    }

    setLoading(false);
    setLoading(true);
    try {
      await inventoryAPI.createProduct({
        name,
        sku,
        price: priceFloat,
        expiration_date: expirationDate ? expirationDate : null,
      });
      Alert.alert('Éxito', 'Producto registrado correctamente en el inventario.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto. Valida que el código SKU no esté duplicado.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.form}>
        <Text style={dynamicStyles.title}>NUEVO PRODUCTO</Text>
        
        <Text style={dynamicStyles.label}>NOMBRE DEL PRODUCTO</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: Manteca Industrial 24kg"
          placeholderTextColor={colors.secondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={dynamicStyles.label}>CÓDIGO DE BARRAS / SKU</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: SKP-098-765"
          placeholderTextColor={colors.secondary}
          value={sku}
          onChangeText={setSku}
          autoCapitalize="characters"
        />

        <Text style={dynamicStyles.label}>PRECIO DE VENTA ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: 45.50"
          placeholderTextColor={colors.secondary}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={dynamicStyles.label}>FECHA DE VENCIMIENTO (Opcional - YYYY-MM-DD)</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: 2026-12-31"
          placeholderTextColor={colors.secondary}
          value={expirationDate}
          onChangeText={setExpirationDate}
        />

        <TouchableOpacity 
          style={[dynamicStyles.saveButton, loading && dynamicStyles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="add-shopping-cart" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={dynamicStyles.saveButtonText}>REGISTRAR NUEVO PRODUCTO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    padding: 15,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 50,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: colors.dataBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default NewProductScreen;
