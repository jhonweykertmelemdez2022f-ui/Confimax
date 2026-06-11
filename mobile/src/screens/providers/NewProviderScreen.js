import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../theme';
import { providersAPI } from '../../services/api';

export default function NewProviderScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [sells, setSells] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactId, setContactId] = useState('');
  const [phone, setPhone] = useState('');
  const [rif, setRif] = useState('');

  const handleSave = async () => {
    if (!companyName.trim()) {
      return Alert.alert('Error', 'El nombre de la empresa es requerido.');
    }

    try {
      await providersAPI.createProvider({
        company_name: companyName,
        description,
        sells,
        contact_name: contactName,
        contact_id: contactId,
        phone,
        rif,
      });
      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudo guardar el proveedor.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.page, backgroundColor: colors.surfaceDim },
    input: { borderWidth: 1, borderColor: colors.borderMuted, padding: 12, marginBottom: 16, borderRadius: 10, backgroundColor: colors.surface },
    label: { marginBottom: 6, fontSize: 14, fontWeight: '700', color: colors.onSurface },
    button: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre de la empresa</Text>
      <TextInput value={companyName} onChangeText={setCompanyName} style={styles.input} placeholder="Empresa" />
      <Text style={styles.label}>Descripción</Text>
      <TextInput value={description} onChangeText={setDescription} style={styles.input} placeholder="Descripción de la empresa" multiline />
      <Text style={styles.label}>Qué vende</Text>
      <TextInput value={sells} onChangeText={setSells} style={styles.input} placeholder="Productos o servicios que ofrece" multiline />
      <Text style={styles.label}>Nombre del vendedor</Text>
      <TextInput value={contactName} onChangeText={setContactName} style={styles.input} placeholder="Nombre del contacto" />
      <Text style={styles.label}>Cédula del vendedor</Text>
      <TextInput value={contactId} onChangeText={(text) => setContactId(text.replace(/\D/g, ''))} style={styles.input} placeholder="Cédula / ID" keyboardType="numeric" />
      <Text style={styles.label}>Teléfono</Text>
      <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" />
      <Text style={styles.label}>RIF de la empresa</Text>
      <TextInput value={rif} onChangeText={(text) => setRif(text.replace(/\s/g, ''))} style={styles.input} placeholder="RIF" />
      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Guardar proveedor</Text>
      </TouchableOpacity>
    </View>
  );
}
