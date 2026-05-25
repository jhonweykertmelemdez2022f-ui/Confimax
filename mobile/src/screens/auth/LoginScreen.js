import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { validateUsername, validatePassword } from '../../utils/validation';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

// Componente animado elástico nativo para efectos en cascada cinemática
function FadeInUpCard({ children, delay = 0, duration = 400 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
      {children}
    </Animated.View>
  );
}

function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, isLoading, error } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [detailedError, setDetailedError] = useState('');

  // Estados para Biometría
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    setDetailedError('');
    try {
      // Hacer ping rápido al endpoint /health de auth-service expuesto en el Gateway
      const response = await api.get('/auth/health', { timeout: 8000 });
      if (response.status === 200) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        setDetailedError(`Respuesta incorrecta: ${response.status}`);
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setDetailedError(err.message || 'Error de Red (Timeout)');
      console.error(' Error de depuración de conexión móvil:', err);
    }
  };

  const checkBiometrics = async () => {
    try {
      // 1. Verificar hardware compatible
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supported = hasHardware && isEnrolled;
      setIsBiometricSupported(supported);

      // 2. Verificar si tenemos credenciales encriptadas guardadas
      const savedCreds = await SecureStore.getItemAsync('confimax_credentials');
      if (savedCreds) {
        setHasSavedCredentials(true);
        // Pre-cargar el nombre de usuario para una UX ultra premium
        const { username: savedUsername } = JSON.parse(savedCreds);
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } else {
        setHasSavedCredentials(false);
        setUsername('');
      }
    } catch (err) {
      console.log('Error checking biometrics:', err);
    }
  };

  useEffect(() => {
    checkConnection();
    checkBiometrics();
  }, []);

  // Función para disparar la lectura de huella/rostro
  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate con tu huella para entrar a Confimax',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Carga y desencripta las credenciales
        const savedCreds = await SecureStore.getItemAsync('confimax_credentials');
        if (savedCreds) {
          const { username: savedUser, password: savedPassword } = JSON.parse(savedCreds);

          // Login instantáneo automático contra el backend
          const success = await login(savedUser, savedPassword);
          if (success) {
            navigation.replace('Main');
          } else {
            const freshError = useAuthStore.getState().error;
            let friendlyMessage = 'No se pudo conectar con el servidor.';
            if (freshError === 'Invalid credentials' || freshError?.toLowerCase().includes('credential')) {
              friendlyMessage = 'Credenciales guardadas inválidas o expiradas.';
              // Si las credenciales guardadas son inválidas, las eliminamos para no seguir mostrando el botón
              await SecureStore.deleteItemAsync('confimax_credentials');
              setHasSavedCredentials(false);
              setUsername('');
            } else if (freshError) {
              friendlyMessage = freshError;
            }
            Alert.alert('Autenticación Fallida', friendlyMessage);
          }
        }
      }
    } catch (err) {
      console.error('Biometric authentication error:', err);
      Alert.alert('Error', 'Hubo un error con la autenticación biométrica');
    }
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    
    // Validate fields
    const usernameError = validateUsername(trimmedUsername);
    const passwordError = validatePassword(password);
    
    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError,
      });
      return;
    }
    
    setErrors({});

    const success = await login(trimmedUsername, password);
    if (success) {
      navigation.replace('Main');
    } else {
      // Obtener el error más fresco del store para evitar el bug de clausura de React
      const freshError = useAuthStore.getState().error;

      // Mapeador amigable de errores de red y credenciales para el usuario de la 
      let friendlyMessage = 'Hubo un problema al iniciar sesión. Inténtalo de nuevo.';

      if (freshError === 'Invalid credentials' || freshError?.toLowerCase().includes('credential')) {
        friendlyMessage = 'El usuario o la contraseña ingresados son incorrectos. Por favor, verifícalos.';
      } else if (
        freshError?.toLowerCase().includes('network') ||
        freshError?.toLowerCase().includes('timeout') ||
        freshError?.toLowerCase().includes('conn')
      ) {
        friendlyMessage = 'No hay conexión con el servidor de Confimax. Asegúrate de estar en la misma red WiFi o VPN (IP 192.168.101.4).';
      } else if (freshError) {
        friendlyMessage = freshError;
      }

      Alert.alert('Inicio de Sesión Fallido', friendlyMessage);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}>

      {/* Barra de Estado de Conexión Flotante y Estética */}
      <View style={[
        dynamicStyles.connectionBanner,
        connectionStatus === 'connected' && dynamicStyles.bannerConnected,
        connectionStatus === 'disconnected' && dynamicStyles.bannerDisconnected,
        connectionStatus === 'checking' && dynamicStyles.bannerChecking,
      ]}>
        {connectionStatus === 'checking' && (
          <>
            <ActivityIndicator size="small" color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text style={dynamicStyles.bannerText}>Comprobando conexión con servidores Confimax...</Text>
          </>
        )}
        {connectionStatus === 'connected' && (
          <Text style={dynamicStyles.bannerText}>🟢 Conectado con éxito a los servicios de Confimax</Text>
        )}
        {connectionStatus === 'disconnected' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={dynamicStyles.bannerText}> SIN CONEXIÓN a Confimax (IP 192.168.101.4)</Text>
            {detailedError ? <Text style={dynamicStyles.bannerErrorSubtext}>{detailedError}</Text> : null}
            <Button title="Reintentar Conexión" color={colors.onPrimary} onPress={checkConnection} />
          </View>
        )}
      </View>

      <View style={dynamicStyles.content}>
        {/* Cabecera Animada */}
        <FadeInUpCard delay={0} duration={400}>
          <Text style={dynamicStyles.title}>Confimax</Text>
        </FadeInUpCard>

        <FadeInUpCard delay={100} duration={400}>
          <Text style={dynamicStyles.subtitle}>Iniciar Sesión</Text>
        </FadeInUpCard>

        {/* Inputs Animados */}
        <FadeInUpCard delay={200} duration={400}>
          <TextInput
            style={[dynamicStyles.input, errors.username && dynamicStyles.inputError]}
            placeholder="Usuario"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors(prev => ({...prev, username: null}));
            }}
            autoCapitalize="none"
          />
          {errors.username && <Text style={dynamicStyles.errorText}>{errors.username}</Text>}
        </FadeInUpCard>

        <FadeInUpCard delay={300} duration={400}>
          <TextInput
            style={[dynamicStyles.input, errors.password && dynamicStyles.inputError]}
            placeholder="Contraseña"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors(prev => ({...prev, password: null}));
            }}
            secureTextEntry
          />
          {errors.password && <Text style={dynamicStyles.errorText}>{errors.password}</Text>}
        </FadeInUpCard>

        {/* Botonera de Acción Animada */}
        <FadeInUpCard delay={400} duration={400}>
          <View style={dynamicStyles.actionContainer}>
            <TouchableOpacity
              style={[dynamicStyles.loginButton, isLoading && dynamicStyles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={dynamicStyles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {isBiometricSupported && hasSavedCredentials ? (
              <TouchableOpacity
                style={dynamicStyles.biometricButton}
                onPress={handleBiometricAuth}
                activeOpacity={0.7}
              >
                <MaterialIcons name="fingerprint" size={32} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </FadeInUpCard>

        {/* Huella Rápida Animada */}
        {isBiometricSupported && hasSavedCredentials ? (
          <FadeInUpCard delay={500} duration={400}>
            <TouchableOpacity
              style={dynamicStyles.biometricQuickLink}
              onPress={handleBiometricAuth}
            >
              <Text style={dynamicStyles.biometricQuickLinkText}>
                Iniciar sesión rápidamente con huella dactilar
              </Text>
            </TouchableOpacity>
          </FadeInUpCard>
        ) : null}

        {/* Enlace de Registro al final de la Cascada */}
        <FadeInUpCard delay={600} duration={400}>
          <Text style={dynamicStyles.registerText}>
            ¿No tienes cuenta?{' '}
            <Text
              style={dynamicStyles.registerLink}
              onPress={() => navigation.navigate('Register')}>
              Regístrate
            </Text>
          </Text>
        </FadeInUpCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: colors.onSurface,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.muted,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  connectionBanner: {
    paddingTop: Platform.OS === 'ios' ? 45 : 30,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bannerChecking: {
    backgroundColor: '#F59E0B',
  },
  bannerConnected: {
    backgroundColor: '#10B981',
  },
  bannerDisconnected: {
    backgroundColor: colors.error,
    paddingBottom: 15,
  },
  bannerText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  bannerErrorSubtext: {
    color: colors.error + '33',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  loginButton: {
    flex: 1,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
  biometricButton: {
    width: 52,
    height: 52,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    backgroundColor: colors.surface,
  },
  biometricQuickLink: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricQuickLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
