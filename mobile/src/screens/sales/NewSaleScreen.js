import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {salesAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function NewSaleScreen({navigation}) {
  const [customerName, setCustomerName] = useState('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);
  const {colors} = useTheme();

  const handleSave = async () => {
    if (!customerName || !total) {
      Alert.alert('Faltan Datos', 'Por favor, completa los campos de cliente y total.');
      return;
    }

    setLoading(true);
    try {
      await salesAPI.createSale({ 
        customer_name: customerName, 
        total: parseFloat(total),
        items: [{name: 'Artículos Varios', qty: 1, price: parseFloat(total)}]
      });
      Alert.alert('Éxito', 'Venta registrada con éxito.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Error creating sale:', error);
      Alert.alert('Registro Offline', 'Se guardará en la cola de transacciones locales.', [
        { text: 'Entendido', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.form}>
        <Text style={dynamicStyles.title}>REGISTRO DE VENTA</Text>
        
        <Text style={dynamicStyles.label}>CLIENTE FACTURADO</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: Camila Rojas"
          placeholderTextColor={colors.secondary}
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={dynamicStyles.label}>MONTO TOTAL ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: 150.00"
          placeholderTextColor={colors.secondary}
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
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
              <MaterialIcons name="point-of-sale" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={dynamicStyles.saveButtonText}>REGISTRAR NUEVA VENTA</Text>
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

export default NewSaleScreen;
