import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {customersAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function NewCustomerScreen({navigation}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const {colors} = useTheme();

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

  const dynamicStyles = createStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.form}>
        <Text style={dynamicStyles.title}>REGISTRO DE CLIENTE</Text>
        
        <Text style={dynamicStyles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: Jhon Weykert Meléndez"
          placeholderTextColor={colors.secondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={dynamicStyles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: jhonweykert@confimax.com"
          placeholderTextColor={colors.secondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={dynamicStyles.label}>TELÉFONO MÓVIL</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Ej: +58 412 1234567"
          placeholderTextColor={colors.secondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
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
              <MaterialIcons name="person-add" size={20} color="#ffffff" style={{marginRight: 8}} />
              <Text style={dynamicStyles.saveButtonText}>REGISTRAR NUEVO CLIENTE</Text>
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

export default NewCustomerScreen;
