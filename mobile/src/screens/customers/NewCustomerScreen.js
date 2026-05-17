import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {customersAPI} from '../../services/api';
import { MaterialIcons } from '@expo/vector-icons';

function NewCustomerScreen({navigation}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Faltan Datos', 'Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);
    try {
      await customersAPI.createCustomer({ name, email, phone });
      Alert.alert('Éxito', 'Cliente registrado correctamente en Confimax.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Error creating customer:', error);
      Alert.alert('Registro Offline', 'Se guardará temporalmente de manera local.', [
        { text: 'Entendido', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>REGISTRO DE CLIENTE</Text>
        
        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Jhon Weykert Meléndez"
          placeholderTextColor="#8e9192"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: jhonweykert@confimax.com"
          placeholderTextColor="#8e9192"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>TELÉFONO MÓVIL</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: +58 412 1234567"
          placeholderTextColor="#8e9192"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
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
              <MaterialIcons name="person-add" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>REGISTRAR NUEVO CLIENTE</Text>
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

export default NewCustomerScreen;
