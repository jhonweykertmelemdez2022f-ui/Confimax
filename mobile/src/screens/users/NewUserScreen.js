import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {authAPI} from '../../services/api';
import { useTheme } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { validateUsername, validateEmail, validatePassword } from '../../utils/validation';

function NewUserScreen({navigation, route}) {
  const {colors} = useTheme();
  const editingUser = route.params?.user;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendor'); // Default role
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.name || editingUser.username || '');
      setEmail(editingUser.email || '');
      setRole(editingUser.role || 'vendor');
    }
  }, [editingUser]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    // Validations
    const usernameError = validateUsername(trimmedUsername);
    const emailError = validateEmail(trimmedEmail);
    // Password is only validated when creating a user, not when editing
    const passwordError = !editingUser ? validatePassword(password) : null;

    if (usernameError || emailError || passwordError) {
      setErrors({
        username: usernameError,
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (editingUser) {
        // Edit User
        await authAPI.updateUser(editingUser.id, {
          username: trimmedUsername,
          email: trimmedEmail,
          role,
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create User
        await authAPI.createUser({
          name: trimmedUsername,
          username: trimmedUsername,
          email: trimmedEmail,
          password,
          role,
        });
        Alert.alert('Éxito', 'Usuario creado correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const serverMessage = error.response?.data?.message || error.message || 'Error desconocido';
      let friendlyMessage = 'No se pudo guardar el usuario. Inténtalo de nuevo.';
      
      if (serverMessage.toLowerCase().includes('email already')) {
        friendlyMessage = 'El correo electrónico ingresado ya está registrado.';
      } else if (serverMessage) {
        friendlyMessage = serverMessage;
      }
      
      Alert.alert('Error', friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'admin', label: 'Administrador', icon: 'security', color: '#EF4444', desc: 'Acceso total y gestión de usuarios.' },
    { key: 'vendor', label: 'Vendedor', icon: 'point-of-sale', color: '#F59E0B', desc: 'Facturación, inventarios y clientes.' },
    { key: 'manager', label: 'Gestor (Manager)', icon: 'assignment', color: '#3B82F6', desc: 'Administra productos e inventario.' },
    { key: 'customer', label: 'Cliente (Customer)', icon: 'people', color: '#10B981', desc: 'Visualización básica en la app.' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, {backgroundColor: colors.surfaceDim}]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.form, {backgroundColor: colors.surface, borderColor: colors.borderMuted}]}>
          <Text style={[styles.title, {color: colors.primary}]}>
            {editingUser ? 'EDITAR USUARIO' : 'REGISTRAR USUARIO'}
          </Text>

          <Text style={[styles.label, {color: colors.secondary}]}>NOMBRE DE USUARIO</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.surfaceDim, borderColor: colors.borderMuted, color: colors.primary}, errors.username && styles.inputError]}
            placeholder="Ej: jhonweykert"
            placeholderTextColor={colors.secondary}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors(prev => ({...prev, username: null}));
            }}
            autoCapitalize="none"
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          <Text style={[styles.label, {color: colors.secondary}]}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.surfaceDim, borderColor: colors.borderMuted, color: colors.primary}, errors.email && styles.inputError]}
            placeholder="Ej: jhonweykert@confimax.com"
            placeholderTextColor={colors.secondary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors(prev => ({...prev, email: null}));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {!editingUser && (
            <>
              <Text style={[styles.label, {color: colors.secondary}]}>CONTRASEÑA</Text>
              <TextInput
                style={[styles.input, {backgroundColor: colors.surfaceDim, borderColor: colors.borderMuted, color: colors.primary}, errors.password && styles.inputError]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.secondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({...prev, password: null}));
                }}
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </>
          )}

          <Text style={[styles.label, {color: colors.secondary, marginBottom: 15}]}>ROL DEL USUARIO</Text>
          
          <View style={styles.roleGrid}>
            {roles.map((item) => {
              const isSelected = role === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: colors.surfaceDim,
                      borderColor: isSelected ? item.color : colors.borderMuted,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                  onPress={() => setRole(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleHeader}>
                    <MaterialIcons 
                      name={item.icon} 
                      size={20} 
                      color={isSelected ? item.color : colors.secondary} 
                    />
                    <Text style={[
                      styles.roleLabel, 
                      {
                        color: isSelected ? colors.primary : colors.secondary,
                        fontWeight: isSelected ? 'bold' : '500'
                      }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.roleDesc, {color: colors.secondary}]}>{item.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.dataBlue}, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name={editingUser ? "save" : "person-add"} size={20} color="#ffffff" style={{marginRight: 8}} />
                <Text style={styles.saveButtonText}>
                  {editingUser ? 'GUARDAR CAMBIOS' : 'REGISTRAR NUEVO USUARIO'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15,
  },
  form: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  roleGrid: {
    marginBottom: 15,
  },
  roleCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleLabel: {
    fontSize: 14,
    marginLeft: 10,
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 30,
  },
  saveButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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

export default NewUserScreen;
