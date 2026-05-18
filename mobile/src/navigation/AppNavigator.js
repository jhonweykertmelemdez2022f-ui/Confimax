import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useAuthStore } from '../stores/authStore';


// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProductsScreen from '../screens/inventory/ProductsScreen';
import SalesScreen from '../screens/sales/SalesScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Detail & Creation Screens
import ProductDetailScreen from '../screens/inventory/ProductDetailScreen';
import SaleDetailScreen from '../screens/sales/SaleDetailScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import NewCustomerScreen from '../screens/customers/NewCustomerScreen';
import NewSaleScreen from '../screens/sales/NewSaleScreen';
import NewProductScreen from '../screens/inventory/NewProductScreen';
import UsersScreen from '../screens/users/UsersScreen';
import NewUserScreen from '../screens/users/NewUserScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Componente para animar elásticamente cada icono de la barra inferior al ser pulsado
function AnimatedTabIcon({ name, focused, color, size }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        // Squeeze/Encogimiento inicial al tocar
        Animated.timing(scaleAnim, {
          toValue: 0.82,
          duration: 90,
          useNativeDriver: true,
        }),
        // Salto elástico expansivo
        Animated.spring(scaleAnim, {
          toValue: 1.25,
          friction: 4,
          tension: 45,
          useNativeDriver: true,
        }),
        // Retorno fluido a escala normal
        Animated.spring(scaleAnim, {
          toValue: 1.0,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <MaterialIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = 'home';
          } else if (route.name === 'Productos') {
            iconName = 'inventory-2';
          } else if (route.name === 'Ventas') {
            iconName = 'point-of-sale';
          } else if (route.name === 'Clientes') {
            iconName = 'people';
          } else if (route.name === 'Perfil') {
            iconName = 'person';
          }

          // Renderizar nuestro icono interactivo y elástico
          return <AnimatedTabIcon name={iconName} focused={focused} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.dataBlue,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderMuted,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Productos" component={ProductsScreen} />
      {user?.role !== 'customer' && <Tab.Screen name="Ventas" component={SalesScreen} />}
      {user?.role !== 'customer' && <Tab.Screen name="Clientes" component={CustomersScreen} />}
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surfaceDim,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
        },
        // Configuración de animaciones nativas ultra-suaves de transición (iOS style en Android)
        animation: 'slide_from_right',
        animationDuration: 220,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{title: 'Crear Cuenta'}}
      />
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: 'Detalle del Artículo'}}
      />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{title: 'Comprobante de Venta'}}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{title: 'Perfil de Cliente'}}
      />
      <Stack.Screen
        name="NewCustomer"
        component={NewCustomerScreen}
        options={{title: 'Registrar Cliente'}}
      />
      <Stack.Screen
        name="NewSale"
        component={NewSaleScreen}
        options={{title: 'Registrar Venta'}}
      />
      <Stack.Screen
        name="NewProduct"
        component={NewProductScreen}
        options={{title: 'Registrar Producto'}}
      />
      <Stack.Screen
        name="Users"
        component={UsersScreen}
        options={{title: 'Gestionar Usuarios'}}
      />
      <Stack.Screen
        name="NewUser"
        component={NewUserScreen}
        options={({ route }) => ({ title: route.params?.user ? 'Editar Usuario' : 'Registrar Usuario' })}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;
