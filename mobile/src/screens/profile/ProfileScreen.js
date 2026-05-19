import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Animated,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useTheme } from '../../theme';
import { useIsFocused } from '@react-navigation/native';

// Componente animado elástico nativo para efectos en cascada cinemática
function FadeInUpCard({ children, delay = 0, duration = 400 }) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      translateYAnim.setValue(25);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      translateYAnim.setValue(25);
    }
  }, [isFocused]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function ProfileScreen({navigation}) {
  const {user, logout, updateUser} = useAuthStore();
  const {isDark, colors} = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  // Estados para Modales Interactivos
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [pushModalVisible, setPushModalVisible] = useState(false);

  // Campos de Edición de Perfil
  const [editUsername, setEditUsername] = useState(user?.name || user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');


  // Campos de Configuración de Cuenta
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Notificaciones Push
  const [notifySales, setNotifySales] = useState(true);
  const [notifyStock, setNotifyStock] = useState(true);
  const [notifyCustomers, setNotifyCustomers] = useState(false);

  // Sincronizar datos al cargar
  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Corregido: navegar de regreso al stack principal para evitar bloqueos
            navigation.getParent()?.reset({
              index: 0,
              routes: [{name: 'Login'}],
            });
          },
        },
      ],
    );
  };

  const handleSaveProfile = () => {
    if (!editUsername || !editEmail) {
      Alert.alert('Error', 'Por favor completa todos los campos del perfil');
      return;
    }
    updateUser({ username: editUsername, email: editEmail });
    setEditModalVisible(false);
    Alert.alert('Éxito', 'Información de perfil actualizada exitosamente');
  };

  const handleSaveConfig = () => {
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }
      Alert.alert('Éxito', 'Ajustes de cuenta y contraseña actualizados');
    } else {
      Alert.alert('Éxito', 'Configuración de cuenta guardada');
    }
    setNewPassword('');
    setConfirmPassword('');
    setConfigModalVisible(false);
  };

  const dynamicStyles = createStyles(colors);

  return (
    <ScrollView style={dynamicStyles.container}>
      {/* Cabecera del Perfil */}
      <FadeInUpCard delay={0} duration={350}>
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.avatar}>
            <Icon name="person" size={60} color={colors.dataBlue} />
          </View>
          <Text style={dynamicStyles.username}>{user?.name || user?.username || 'Usuario'}</Text>
          <Text style={dynamicStyles.email}>{user?.email || 'usuario@confimax.com'}</Text>

        </View>
      </FadeInUpCard>

      <View style={dynamicStyles.menu}>
        {/* Editar Perfil */}
        <FadeInUpCard delay={80} duration={350}>
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => setEditModalVisible(true)}>
            <Icon name="edit" size={24} color={colors.dataBlue} />
            <Text style={dynamicStyles.menuLabel}>Editar Perfil</Text>
            <Icon name="chevron-right" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </FadeInUpCard>

        {/* Interruptor Modo Oscuro */}
        <FadeInUpCard delay={160} duration={350}>
          <View style={dynamicStyles.menuItem}>
            <Icon name="dark-mode" size={24} color={colors.accentPink} />
            <Text style={dynamicStyles.menuLabel}>Tema Oscuro / Neón</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.dataBlue }}
              thumbColor={isDark ? colors.accentPink : '#f4f3f4'}
            />
          </View>
        </FadeInUpCard>

        {/* Configuración de Cuenta */}
        <FadeInUpCard delay={240} duration={350}>
          <TouchableOpacity 
            style={[
              dynamicStyles.menuItem, 
              user?.role === 'customer' && { borderBottomWidth: 0 }
            ]} 
            onPress={() => setConfigModalVisible(true)}
          >
            <Icon name="settings" size={24} color={colors.secondary} />
            <Text style={dynamicStyles.menuLabel}>Configuración de Cuenta</Text>
            <Icon name="chevron-right" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </FadeInUpCard>

        {/* Notificaciones Push */}
        {user?.role !== 'customer' && (
          <FadeInUpCard delay={320} duration={350}>
            <TouchableOpacity 
              style={[
                dynamicStyles.menuItem, 
                user?.role !== 'admin' && { borderBottomWidth: 0 }
              ]} 
              onPress={() => setPushModalVisible(true)}
            >
              <Icon name="notifications" size={24} color={colors.secondary} />
              <Text style={dynamicStyles.menuLabel}>Notificaciones Push</Text>
              <Icon name="chevron-right" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}

        {/* Gestionar Usuarios (Solo Admin) */}
        {user?.role === 'admin' && (
          <FadeInUpCard delay={400} duration={350}>
            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => navigation.navigate('Users')}
            >
              <Icon name="people" size={24} color={colors.dataBlue} />
              <Text style={dynamicStyles.menuLabel}>Gestionar Usuarios (CRUD)</Text>
              <Icon name="chevron-right" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}

        {/* Auditoría del Sistema (Solo Admin) */}
        {user?.role === 'admin' && (
          <FadeInUpCard delay={440} duration={350}>
            <TouchableOpacity 
              style={[dynamicStyles.menuItem, { borderBottomWidth: 0 }]} 
              onPress={() => navigation.navigate('AuditLogs')}
            >
              <Icon name="security" size={24} color={colors.accentPink} />
              <Text style={dynamicStyles.menuLabel}>Auditoría de Logs (MongoDB)</Text>
              <Icon name="chevron-right" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}
      </View>

      {/* Botón Cerrar Sesión */}
      <FadeInUpCard delay={400} duration={350}>
        <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF3B30" />
          <Text style={dynamicStyles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </FadeInUpCard>

      <Text style={dynamicStyles.version}>Versión 1.1.0 // Confimax</Text>

      {/* ========================================== */}
      {/* MODAL: EDITAR PERFIL                       */}
      {/* ========================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={dynamicStyles.modalInputLabel}>Nombre de Usuario</Text>
            <TextInput
              style={dynamicStyles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Nombre de Usuario"
              placeholderTextColor={colors.secondary}
            />

            <Text style={dynamicStyles.modalInputLabel}>Correo Electrónico</Text>
            <TextInput
              style={dynamicStyles.modalInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity style={[dynamicStyles.modalButton, dynamicStyles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                <Text style={dynamicStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.modalButton, dynamicStyles.saveBtn]} onPress={handleSaveProfile}>
                <Text style={[dynamicStyles.modalButtonText, { color: '#fff' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* MODAL: CONFIGURACIÓN DE CUENTA            */}
      {/* ========================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={configModalVisible}
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Ajustes de Cuenta</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Icon name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={dynamicStyles.modalInputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={dynamicStyles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.secondary}
              secureTextEntry
            />

            <Text style={dynamicStyles.modalInputLabel}>Confirmar Contraseña</Text>
            <TextInput
              style={dynamicStyles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la contraseña"
              placeholderTextColor={colors.secondary}
              secureTextEntry
            />

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity style={[dynamicStyles.modalButton, dynamicStyles.cancelBtn]} onPress={() => setConfigModalVisible(false)}>
                <Text style={dynamicStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.modalButton, dynamicStyles.saveBtn]} onPress={handleSaveConfig}>
                <Text style={[dynamicStyles.modalButtonText, { color: '#fff' }]}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* MODAL: NOTIFICACIONES PUSH                 */}
      {/* ========================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pushModalVisible}
        onRequestClose={() => setPushModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Notificaciones Push</Text>
              <TouchableOpacity onPress={() => setPushModalVisible(false)}>
                <Icon name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Alertas de Ventas</Text>
                <Text style={dynamicStyles.switchDescription}>Notificar cada comprobante de venta emitido hoy.</Text>
              </View>
              <Switch
                value={notifySales}
                onValueChange={setNotifySales}
                trackColor={{ false: '#767577', true: colors.dataBlue }}
                thumbColor={notifySales ? colors.dataBlue : '#f4f3f4'}
              />
            </View>

            <View style={dynamicStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Aviso de Stock Crítico</Text>
                <Text style={dynamicStyles.switchDescription}>Notificar si algún producto cae por debajo de su stock de seguridad.</Text>
              </View>
              <Switch
                value={notifyStock}
                onValueChange={setNotifyStock}
                trackColor={{ false: '#767577', true: colors.dataBlue }}
                thumbColor={notifyStock ? colors.dataBlue : '#f4f3f4'}
              />
            </View>

            <View style={dynamicStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.switchLabel}>Nuevos Clientes</Text>
                <Text style={dynamicStyles.switchDescription}>Notificar al registrar un cliente en la zona de Mongo.</Text>
              </View>
              <Switch
                value={notifyCustomers}
                onValueChange={setNotifyCustomers}
                trackColor={{ false: '#767577', true: colors.dataBlue }}
                thumbColor={notifyCustomers ? colors.dataBlue : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={[dynamicStyles.modalButton, dynamicStyles.saveBtn, { width: '100%', marginTop: 25 }]} onPress={() => setPushModalVisible(false)}>
              <Text style={[dynamicStyles.modalButtonText, { color: '#fff', textAlign: 'center' }]}>Guardar Ajustes</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: colors.surfaceDim,
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.dataBlue,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 5,
  },
  menu: {
    backgroundColor: colors.surface,
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 15,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 15,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  // Estilos de los Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    height: 48,
    backgroundColor: colors.surfaceDim,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  saveBtn: {
    backgroundColor: colors.dataBlue,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  // Switches de Notificación
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 3,
    paddingRight: 10,
  },
});

export default ProfileScreen;
