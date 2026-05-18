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
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      console.error('🔴 Error de depuración de conexión móvil:', err);
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
    if (!username || !password) {
      Alert.alert('Datos Incompletos', 'Por favor completa todos los campos');
      return;
    }

    const success = await login(username, password);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>

      {/* Barra de Estado de Conexión Flotante y Estética */}
      <View style={[
        styles.connectionBanner,
        connectionStatus === 'connected' && styles.bannerConnected,
        connectionStatus === 'disconnected' && styles.bannerDisconnected,
        connectionStatus === 'checking' && styles.bannerChecking,
      ]}>
        {connectionStatus === 'checking' && (
          <>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bannerText}>Comprobando conexión con servidores Confimax...</Text>
          </>
        )}
        {connectionStatus === 'connected' && (
          <Text style={styles.bannerText}>🟢 Conectado con éxito a los servicios de Confimax</Text>
        )}
        {connectionStatus === 'disconnected' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.bannerText}>🔴 SIN CONEXIÓN a Confimax (IP 192.168.101.4)</Text>
            {detailedError ? <Text style={styles.bannerErrorSubtext}>{detailedError}</Text> : null}
            <Button title="Reintentar Conexión" color="#fff" onPress={checkConnection} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Cabecera Animada */}
        <FadeInUpCard delay={0} duration={400}>
          <Text style={styles.title}>Confimax</Text>
        </FadeInUpCard>

        <FadeInUpCard delay={100} duration={400}>
          <Text style={styles.subtitle}>Iniciar Sesión</Text>
        </FadeInUpCard>

        {/* Inputs Animados */}
        <FadeInUpCard delay={200} duration={400}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#7a7a7a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </FadeInUpCard>

        <FadeInUpCard delay={300} duration={400}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#7a7a7a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </FadeInUpCard>

        {/* Botonera de Acción Animada */}
        <FadeInUpCard delay={400} duration={400}>
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {isBiometricSupported && hasSavedCredentials ? (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
                activeOpacity={0.7}
              >
                <MaterialIcons name="fingerprint" size={32} color="#0066FF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </FadeInUpCard>

        {/* Huella Rápida Animada */}
        {isBiometricSupported && hasSavedCredentials ? (
          <FadeInUpCard delay={500} duration={400}>
            <TouchableOpacity
              style={styles.biometricQuickLink}
              onPress={handleBiometricAuth}
            >
              <Text style={styles.biometricQuickLinkText}>
                Iniciar sesión rápidamente con huella dactilar
              </Text>
            </TouchableOpacity>
          </FadeInUpCard>
        ) : null}

        {/* Enlace de Registro al final de la Cascada */}
        <FadeInUpCard delay={600} duration={400}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}>
              Regístrate
            </Text>
          </Text>
        </FadeInUpCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#c4c7c8',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: '#141313',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#e5e2e1',
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#c4c7c8',
  },
  registerLink: {
    color: '#0066FF',
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
    backgroundColor: '#EF4444',
    paddingBottom: 15,
  },
  bannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  bannerErrorSubtext: {
    color: '#FEE2E2',
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
    backgroundColor: '#0066FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#1c1b1b',
  },
  biometricButton: {
    width: 52,
    height: 52,
    borderColor: '#0066FF',
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    backgroundColor: '#141313',
  },
  biometricQuickLink: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricQuickLinkText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
