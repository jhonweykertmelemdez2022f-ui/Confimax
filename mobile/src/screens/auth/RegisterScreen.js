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
import { validateUsername, validateEmail, validatePassword } from '../../utils/validation';
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

function RegisterScreen({navigation}) {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const {register, isLoading} = useAuthStore();

  const handleRegister = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    // Validate fields
    const usernameError = validateUsername(trimmedUsername);
    const emailError = validateEmail(trimmedEmail);
    const passwordError = validatePassword(password);
    
    let confirmPasswordError = null;
    if (password !== confirmPassword) {
      confirmPasswordError = 'Las contraseñas no coinciden';
    } else if (!confirmPassword) {
      confirmPasswordError = 'Por favor confirma tu contraseña';
    }

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        username: usernameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }
    
    setErrors({});

    const success = await register(trimmedUsername, trimmedEmail, password);
    if (success) {
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
      navigation.navigate('Login');
    } else {
      const freshError = useAuthStore.getState().error;
      let friendlyMessage = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (freshError === 'Email already exists') {
        friendlyMessage = 'El correo electrónico ya está registrado.';
      } else if (freshError) {
        friendlyMessage = freshError;
      }
      Alert.alert('Error de Registro', friendlyMessage);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}>
      <View style={dynamicStyles.content}>
        {/* Cabecera Animada */}
        <FadeInUpCard delay={0} duration={350}>
          <Text style={dynamicStyles.title}>Confimax</Text>
        </FadeInUpCard>
        
        <FadeInUpCard delay={80} duration={350}>
          <Text style={dynamicStyles.subtitle}>Crear Cuenta</Text>
        </FadeInUpCard>

        {/* Inputs Animados */}
        <FadeInUpCard delay={160} duration={350}>
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

        <FadeInUpCard delay={240} duration={350}>
          <TextInput
            style={[dynamicStyles.input, errors.email && dynamicStyles.inputError]}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors(prev => ({...prev, email: null}));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={dynamicStyles.errorText}>{errors.email}</Text>}
        </FadeInUpCard>

        <FadeInUpCard delay={320} duration={350}>
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

        <FadeInUpCard delay={400} duration={350}>
          <TextInput
            style={[dynamicStyles.input, errors.confirmPassword && dynamicStyles.inputError]}
            placeholder="Confirmar Contraseña"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors(prev => ({...prev, confirmPassword: null}));
            }}
            secureTextEntry
          />
          {errors.confirmPassword && <Text style={dynamicStyles.errorText}>{errors.confirmPassword}</Text>}
        </FadeInUpCard>

        {/* Botón de Creación Animado */}
        <FadeInUpCard delay={480} duration={350}>
          <TouchableOpacity
            style={[dynamicStyles.registerButton, isLoading && dynamicStyles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={dynamicStyles.registerButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
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
  registerButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  registerButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: colors.borderMuted,
  },
});

export default RegisterScreen;
