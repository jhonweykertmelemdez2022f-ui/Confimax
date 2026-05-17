import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useAuthStore} from '../../stores/authStore';

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

function RegisterScreen({navigation}) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {isLoading} = useAuthStore();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      // TODO: Implement register API call
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        {/* Cabecera Animada */}
        <FadeInUpCard delay={0} duration={350}>
          <Text style={styles.title}>Confimax</Text>
        </FadeInUpCard>
        
        <FadeInUpCard delay={80} duration={350}>
          <Text style={styles.subtitle}>Crear Cuenta</Text>
        </FadeInUpCard>

        {/* Inputs Animados */}
        <FadeInUpCard delay={160} duration={350}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#7a7a7a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </FadeInUpCard>

        <FadeInUpCard delay={240} duration={350}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#7a7a7a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </FadeInUpCard>

        <FadeInUpCard delay={320} duration={350}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#7a7a7a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </FadeInUpCard>

        <FadeInUpCard delay={400} duration={350}>
          <TextInput
            style={styles.input}
            placeholder="Confirmar Contraseña"
            placeholderTextColor="#7a7a7a"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </FadeInUpCard>

        {/* Botón de Creación Animado */}
        <FadeInUpCard delay={480} duration={350}>
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
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
  registerButton: {
    height: 52,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#1c1b1b',
  },
});

export default RegisterScreen;
