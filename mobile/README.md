# Confimax Mobile App

Aplicación móvil React Native para Confimax - Sistema de gestión para vendedores.

## 📋 Características

- **Autenticación**: Login y registro con JWT
- **Inventario**: Gestión de productos y categorías
- **Ventas**: Registro y seguimiento de ventas
- **Clientes**: CRM básico
- **Sincronización**: Offline-first con WatermelonDB
- **Notificaciones**: Alertas y recordatorios

## 🛠️ Stack Tecnológico

- **React Native**: 0.73.2
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **Database**: WatermelonDB (SQLite local)
- **API**: Axios
- **Security**: React Native Keychain

## 📦 Instalación

### Prerrequisitos

- Node.js >= 18.0.0
- React Native CLI
- Android Studio (para Android) o Xcode (para iOS)

### Pasos

```bash
# Instalar dependencias
npm install

# Para iOS (solo macOS)
cd ios && pod install && cd ..

# Iniciar Metro bundler
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API URL
API_BASE_URL=http://10.0.2.2:3006/api  # Android emulator
# API_BASE_URL=http://localhost:3006/api  # iOS simulator

# Opcional: Para dispositivo real con tu IP local
# API_BASE_URL=http://192.168.1.X:3006/api
```

### Backend

La aplicación se conecta al backend Confimax en:
- **Local**: `http://localhost:3006/api`
- **Android Emulator**: `http://10.0.2.2:3006/api`
- **iOS Simulator**: `http://localhost:3006/api`

Asegúrate de que el backend esté corriendo antes de iniciar la app.

## 📁 Estructura del Proyecto

```
mobile/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── screens/          # Pantallas de la app
│   │   ├── auth/        # Login, Register
│   │   ├── home/        # Dashboard
│   │   ├── inventory/   # Productos
│   │   ├── sales/       # Ventas
│   │   ├── customers/   # Clientes
│   │   └── profile/     # Perfil de usuario
│   ├── navigation/      # Configuración de navegación
│   ├── services/        # API, Database, Sync
│   └── stores/          # Zustand stores
├── App.js               # Entry point
├── index.js             # Registro de la app
└── package.json
```

## 🚀 Scripts Disponibles

```bash
npm start          # Inicia Metro bundler
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm test           # Ejecuta tests
npm run lint       # Ejecuta ESLint
```

## 🔐 Seguridad

- Tokens JWT almacenados en Keychain
- Interceptor de Axios para manejar refresh tokens
- Logout automático en 401 responses

## 📱 Pantallas

### Auth
- **LoginScreen**: Inicio de sesión
- **RegisterScreen**: Registro de usuarios

### Main
- **HomeScreen**: Dashboard con estadísticas
- **ProductsScreen**: Lista y búsqueda de productos
- **SalesScreen**: Historial de ventas
- **CustomersScreen**: Gestión de clientes
- **ProfileScreen**: Perfil y configuración

## 🔄 Sincronización Offline

La app usa WatermelonDB para:
- Almacenar datos localmente
- Sincronizar con el backend cuando hay conexión
- Mantener la app funcional offline

## 🐛 Troubleshooting

### Metro bundler no inicia
```bash
npm start -- --reset-cache
```

### Android build falla
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS build falla
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Error de conexión al backend
- Verifica que el backend esté corriendo en el puerto 3006
- Para Android emulator usa `10.0.2.2` en lugar de `localhost`
- Para dispositivo real usa tu IP local

## 📝 Notas de Desarrollo

### API Services

Los servicios de API están en `src/services/api.js`:
- `authAPI`: Login, register, refresh token
- `inventoryAPI`: Productos, categorías
- `salesAPI`: Ventas, resúmenes
- `customersAPI`: Clientes, deudas
- `notificationsAPI`: Notificaciones

### State Management

Usamos Zustand para el estado global:
- `authStore`: Autenticación y usuario
- Stores adicionales para inventario, ventas, etc.

### Navegación

React Navigation con:
- Stack Navigator para auth flow
- Bottom Tabs para navegación principal

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de Confimax.
