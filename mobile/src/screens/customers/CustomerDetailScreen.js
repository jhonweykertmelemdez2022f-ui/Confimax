import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {customersAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

function CustomerDetailScreen({route, navigation}) {
  const {id} = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const {colors} = useTheme();
  const {user} = useAuthStore();

  // Estados de Edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const response = await customersAPI.getCustomer(id);
      if (response.data) {
        setCustomer(response.data);
        setEditForm({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
        });
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.log('Error fetching customer from backend:', error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editForm.name) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    setUpdating(true);
    try {
      await customersAPI.updateCustomer(id, editForm);
      setEditModalVisible(false);
      loadCustomer();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el cliente.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCustomer = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await customersAPI.deleteCustomer(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el cliente.');
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = createStyles(colors);

  if (loading) {
    return (
      <View style={dynamicStyles.center}>
        <ActivityIndicator size="large" color={colors.dataBlue} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={dynamicStyles.center}>
        <MaterialIcons name="error-outline" size={60} color={colors.secondary} />
        <Text style={dynamicStyles.notFoundText}>Cliente no encontrado</Text>
        <Text style={dynamicStyles.notFoundSub}>El cliente seleccionado no se encuentra registrado en el sistema.</Text>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={dynamicStyles.backButtonText}>VOLVER A CLIENTES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <MaterialIcons name="account-circle" size={80} color={colors.dataBlue} />
        <Text style={dynamicStyles.name}>{customer.name}</Text>
        <View style={dynamicStyles.statusBadge}>
          <Text style={dynamicStyles.statusText}>{customer.status || 'ACTIVO'}</Text>
        </View>
      </View>

      <View style={dynamicStyles.infoSection}>
        <Text style={dynamicStyles.label}>DATOS DE CONTACTO</Text>
        
        <View style={dynamicStyles.infoRow}>
          <MaterialIcons name="email" size={22} color={colors.secondary} style={{marginRight: 12}} />
          <View>
            <Text style={dynamicStyles.infoLabel}>CORREO ELECTRÓNICO</Text>
            <Text style={dynamicStyles.infoValue}>{customer.email || 'No registrado'}</Text>
          </View>
        </View>

        <View style={dynamicStyles.divider} />

        <View style={dynamicStyles.infoRow}>
          <MaterialIcons name="phone" size={22} color={colors.secondary} style={{marginRight: 12}} />
          <View>
            <Text style={dynamicStyles.infoLabel}>TELÉFONO MÓVIL</Text>
            <Text style={dynamicStyles.infoValue}>{customer.phone || 'No registrado'}</Text>
          </View>
        </View>
      </View>

      <View style={dynamicStyles.infoSection}>
        <Text style={dynamicStyles.label}>RESUMEN FINANCIERO</Text>
        <View style={dynamicStyles.infoRow}>
          <MaterialIcons name="monetization-on" size={22} color={colors.dataBlue} style={{marginRight: 12}} />
          <View>
            <Text style={dynamicStyles.infoLabel}>TOTAL CONSUMIDO</Text>
            <Text style={dynamicStyles.financialValue}>${customer.total_spent || '0.00'}</Text>
          </View>
        </View>
      </View>

      {user?.role !== 'customer' && (
        <View style={{ marginTop: 10, marginBottom: 20, marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, { flex: 1, marginRight: 5, backgroundColor: colors.dataBlue, marginTop: 0, marginHorizontal: 0 }]}
            onPress={() => setEditModalVisible(true)}>
            <MaterialIcons name="edit" size={20} color="#ffffff" style={{marginRight: 8}} />
            <Text style={dynamicStyles.actionButtonText}>EDITAR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[dynamicStyles.actionButton, { flex: 1, marginLeft: 5, backgroundColor: colors.error, marginTop: 0, marginHorizontal: 0 }]}
            onPress={handleDeleteCustomer}>
            <MaterialIcons name="delete" size={20} color="#ffffff" style={{marginRight: 8}} />
            <Text style={dynamicStyles.actionButtonText}>ELIMINAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Edición */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>EDITAR CLIENTE</Text>
            <Text style={dynamicStyles.modalSub}>Actualiza los datos del cliente.</Text>

            <Text style={dynamicStyles.modalLabel}>NOMBRE COMPLETO</Text>
            <TextInput style={dynamicStyles.modalInput} value={editForm.name} onChangeText={(t) => setEditForm({...editForm, name: t})} />

            <Text style={dynamicStyles.modalLabel}>EMAIL</Text>
            <TextInput style={dynamicStyles.modalInput} value={editForm.email} onChangeText={(t) => setEditForm({...editForm, email: t})} keyboardType="email-address" />

            <Text style={dynamicStyles.modalLabel}>TELÉFONO</Text>
            <TextInput style={dynamicStyles.modalInput} value={editForm.phone} onChangeText={(t) => setEditForm({...editForm, phone: t})} keyboardType="phone-pad" />

            <Text style={dynamicStyles.modalLabel}>DIRECCIÓN</Text>
            <TextInput style={dynamicStyles.modalInput} value={editForm.address} onChangeText={(t) => setEditForm({...editForm, address: t})} />

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity style={dynamicStyles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={dynamicStyles.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.modalBtnConfirm} onPress={handleUpdateCustomer} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={dynamicStyles.modalBtnConfirmText}>GUARDAR</Text>}
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
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoSection: {
    padding: 20,
    backgroundColor: colors.surface,
    margin: 15,
    marginBottom: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.isDark ? 0.3 : 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
    marginVertical: 15,
  },
  financialValue: {
    fontSize: 22,
    color: colors.dataBlue,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.dataBlue,
    marginHorizontal: 15,
    marginTop: 20,
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
  },
});

export default CustomerDetailScreen;
