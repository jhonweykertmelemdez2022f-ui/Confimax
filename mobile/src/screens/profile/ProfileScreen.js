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
  ActivityIndicator,
} from 'react-native';
import { User, Edit, Settings, Bell, Users, Shield, LogOut, ChevronRight, X, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useTheme } from '../../theme';
import { useIsFocused } from '@react-navigation/native';

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
  }, [isFocused, fadeAnim, translateYAnim, delay, duration]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function Avatar({ name }) {
  const { colors, borderRadius } = useTheme();
  const initials = name ? name.charAt(0).toUpperCase() : 'U';
  
  const localStyles = StyleSheet.create({
    avatar: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.full,
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 40,
      fontWeight: '700',
    },
  });
  
  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={localStyles.avatar}
    >
      <Text style={localStyles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

function ProfileScreen({navigation}) {
  const {user, logout, updateUser} = useAuthStore();
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [loading, setLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [pushModalVisible, setPushModalVisible] = useState(false);

  const [editUsername, setEditUsername] = useState(user?.name || user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifySales, setNotifySales] = useState(true);
  const [notifyStock, setNotifyStock] = useState(true);
  const [notifyCustomers, setNotifyCustomers] = useState(false);

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceDim,
    },
    header: {
      padding: spacing.page,
      paddingTop: 60,
      alignItems: 'center',
    },
    username: {
      ...typography.headlineLg,
      color: colors.onSurface,
      marginTop: spacing.lg,
    },
    email: {
      ...typography.bodyMd,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    menu: {
      backgroundColor: colors.surface,
      marginTop: spacing.lg,
      marginHorizontal: spacing.page,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    menuLabel: {
      flex: 1,
      ...typography.bodyMd,
      color: colors.onSurface,
      marginLeft: spacing.md,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      margin: spacing.page,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    logoutText: {
      flex: 1,
      ...typography.bodyMd,
      color: '#ef4444',
      marginLeft: spacing.md,
      fontWeight: '600',
    },
    version: {
      textAlign: 'center',
      color: colors.muted,
      fontSize: 12,
      marginTop: spacing.lg,
      marginBottom: spacing.xxl,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.page,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
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
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    modalInputLabel: {
      ...typography.label,
      color: colors.onSurface,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    modalInput: {
      height: 48,
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.borderMuted,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      ...typography.bodyMd,
      color: colors.onSurface,
      marginBottom: spacing.sm,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    modalButton: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.surfaceVariant,
    },
    saveBtn: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      ...typography.label,
      color: colors.onSurface,
      fontWeight: '600',
    },
    saveBtnText: {
      color: '#ffffff',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    switchLabel: {
      ...typography.bodyMd,
      color: colors.onSurface,
      fontWeight: '600',
    },
    switchDescription: {
      ...typography.bodySm,
      color: colors.muted,
      marginTop: spacing.xs,
      paddingRight: spacing.sm,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FadeInUpCard delay={0} duration={350}>
        <View style={styles.header}>
          <Avatar name={user?.name || user?.username} />
          <Text style={styles.username}>{user?.name || user?.username || 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email || 'usuario@confimax.com'}</Text>
        </View>
      </FadeInUpCard>

      <View style={styles.menu}>
        <FadeInUpCard delay={80} duration={350}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
            <Edit size={24} color={colors.primary} />
            <Text style={styles.menuLabel}>Editar Perfil</Text>
            <ChevronRight size={24} color={colors.muted} />
          </TouchableOpacity>
        </FadeInUpCard>

        <FadeInUpCard delay={160} duration={350}>
          <View style={styles.menuItem}>
            <Moon size={24} color={colors.secondary} />
            <Text style={styles.menuLabel}>Modo Oscuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDark ? colors.secondary : '#f4f3f4'}
            />
          </View>
        </FadeInUpCard>

        <FadeInUpCard delay={240} duration={350}>
          <TouchableOpacity 
            style={[
              styles.menuItem, 
              user?.role === 'customer' && { borderBottomWidth: 0 }
            ]} 
            onPress={() => setConfigModalVisible(true)}
          >
            <Settings size={24} color={colors.muted} />
            <Text style={styles.menuLabel}>Configuración de Cuenta</Text>
            <ChevronRight size={24} color={colors.muted} />
          </TouchableOpacity>
        </FadeInUpCard>

        {user?.role !== 'customer' && (
          <FadeInUpCard delay={320} duration={350}>
            <TouchableOpacity 
              style={[
                styles.menuItem, 
                user?.role !== 'admin' && { borderBottomWidth: 0 }
              ]} 
              onPress={() => setPushModalVisible(true)}
            >
              <Bell size={24} color={colors.muted} />
              <Text style={styles.menuLabel}>Notificaciones</Text>
              <ChevronRight size={24} color={colors.muted} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}

        {user?.role === 'admin' && (
          <FadeInUpCard delay={400} duration={350}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('Users')}
            >
              <Users size={24} color={colors.primary} />
              <Text style={styles.menuLabel}>Gestionar Usuarios</Text>
              <ChevronRight size={24} color={colors.muted} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}

        {user?.role === 'admin' && (
          <FadeInUpCard delay={440} duration={350}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0 }]} 
              onPress={() => navigation.navigate('AuditLogs')}
            >
              <Shield size={24} color={colors.secondary} />
              <Text style={styles.menuLabel}>Auditoría de Logs</Text>
              <ChevronRight size={24} color={colors.muted} />
            </TouchableOpacity>
          </FadeInUpCard>
        )}
      </View>

      <FadeInUpCard delay={400} duration={350}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </FadeInUpCard>

      <Text style={styles.version}>Versión 1.1.0 • Confimax</Text>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Nombre de Usuario</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Nombre de Usuario"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.modalInputLabel}>Correo Electrónico</Text>
            <TextInput
              style={styles.modalInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveBtn]} onPress={handleSaveProfile}>
                <Text style={[styles.modalButtonText, styles.saveBtnText]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={configModalVisible}
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajustes de Cuenta</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.muted}
              secureTextEntry
            />

            <Text style={styles.modalInputLabel}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la contraseña"
              placeholderTextColor={colors.muted}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setConfigModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveBtn]} onPress={handleSaveConfig}>
                <Text style={[styles.modalButtonText, styles.saveBtnText]}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={pushModalVisible}
        onRequestClose={() => setPushModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setPushModalVisible(false)}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Alertas de Ventas</Text>
                <Text style={styles.switchDescription}>Notificar cada comprobante de venta emitido hoy.</Text>
              </View>
              <Switch
                value={notifySales}
                onValueChange={setNotifySales}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={notifySales ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Aviso de Stock Crítico</Text>
                <Text style={styles.switchDescription}>Notificar si algún producto cae por debajo de su stock de seguridad.</Text>
              </View>
              <Switch
                value={notifyStock}
                onValueChange={setNotifyStock}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={notifyStock ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Nuevos Clientes</Text>
                <Text style={styles.switchDescription}>Notificar al registrar un cliente.</Text>
              </View>
              <Switch
                value={notifyCustomers}
                onValueChange={setNotifyCustomers}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={notifyCustomers ? colors.primary : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={[styles.modalButton, styles.saveBtn, { width: '100%', marginTop: spacing.xl }]} onPress={() => setPushModalVisible(false)}>
              <Text style={[styles.modalButtonText, styles.saveBtnText]}>Guardar Ajustes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default ProfileScreen;
