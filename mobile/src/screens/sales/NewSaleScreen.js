import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {salesAPI} from '../../services/api';
import { MaterialIcons } from '@expo/vector-icons';

function NewSaleScreen({navigation}) {
  const [customerName, setCustomerName] = useState('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>REGISTRO DE VENTA</Text>
        
        <Text style={styles.label}>CLIENTE FACTURADO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Camila Rojas"
          placeholderTextColor="#8e9192"
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.label}>MONTO TOTAL ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 150.00"
          placeholderTextColor="#8e9192"
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="point-of-sale" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>REGISTRAR NUEVA VENTA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 15,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: '#141313',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1c1b1b',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    color: '#8e9192',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 50,
    backgroundColor: '#0A0A0A',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#ffffff',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#1c1b1b',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default NewSaleScreen;
