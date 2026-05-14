# 🏗️ Arquitectura de Conexión Frontend - Backend

## 📊 Flujo de Datos

```
Frontend (Next.js)
    ↓
Nginx (puerto 3000)
    ↓
API Gateway (puerto 8080)
    ↓
Microservicios
    ├── auth-service:3001
    ├── inventory-service:3002
    ├── sales-service:3003
    ├── customers-service:3004
    └── notifications-service:3005
```

## 🔌 Configuración del Cliente API

El cliente API está configurado en `src/lib/api.ts` y se conecta a través del API Gateway.

### Variables de Entorno

```env
# Desarrollo
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Producción
NEXT_PUBLIC_API_URL=https://confimax.bitforges.com/api
```

### Rutas del API Gateway

| Ruta Frontend | Servicio Destino | Puerto |
|---------------|------------------|--------|
| `/api/auth/*` | auth-service | 3001 |
| `/api/inventory/*` | inventory-service | 3002 |
| `/api/sales/*` | sales-service | 3003 |
| `/api/customers/*` | customers-service | 3004 |
| `/api/notifications/*` | notifications-service | 3005 |

## 📦 Componentes Implementados

### 1. Cliente API (`src/lib/api.ts`)

Cliente HTTP con:
- Configuración automática de token JWT
- Manejo de errores centralizado
- Métodos para todos los microservicios
- Interceptor para agregar headers de autenticación

### 2. AuthContext (`src/context/AuthContext.tsx`)

Contexto de autenticación que usa el cliente API:
- `login()` - POST `/api/auth/login`
- `register()` - POST `/api/auth/register`
- `logout()` - POST `/api/auth/logout`
- `recoverPassword()` - POST `/api/auth/recover`

### 3. CartContext (`src/context/CartContext.tsx`)

Contexto del carrito que usa el cliente API:
- `checkout()` - POST `/api/sales` (crea venta)
- Gestión de carrito local con localStorage
- Sincronización con backend al hacer checkout

### 4. Hooks de Productos (`src/hooks/useProducts.ts`)

Hooks personalizados para el inventario:
- `useProducts()` - GET `/api/inventory/products`
- `useProduct(id)` - GET `/api/inventory/products/:id`
- `useCategories()` - GET `/api/inventory/categories`
- `useProductSearch(query)` - GET `/api/inventory/products/search`

## 🔐 Autenticación

### Flujo de Autenticación

1. **Login:**
   - Frontend envía credenciales a `/api/auth/login`
   - API Gateway valida y retorna token JWT
   - Token se guarda en localStorage
   - Token se agrega a todas las peticiones subsiguientes

2. **Peticiones Protegidas:**
   - Cliente API agrega header `Authorization: Bearer <token>`
   - API Gateway valida token antes de enrutar
   - Si token inválido, retorna 401

3. **Logout:**
   - Frontend llama `/api/auth/logout`
   - Token se elimina de localStorage
   - Cliente API deja de enviar token

## 🛒 Flujo de Compra

1. Usuario agrega productos al carrito (local)
2. Usuario hace checkout
3. Frontend envía datos a `/api/sales`
4. API Gateway enruta a sales-service
5. Backend procesa venta y retorna confirmación
6. Carrito se limpia localmente

## 📡 Ejemplos de Uso

### Login

```typescript
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Usuario autenticado
    } catch (error) {
      console.error("Error de login:", error);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Obtener Productos

```typescript
import { useProducts } from "@/hooks/useProducts";

function ProductList() {
  const { products, loading, error } = useProducts({ limit: 20 });
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Crear Venta

```typescript
import { useCart } from "@/context/CartContext";

function CheckoutButton() {
  const { checkout, isCheckingOut } = useCart();
  
  const handleCheckout = async () => {
    try {
      await checkout(undefined, "cash");
      // Venta exitosa
    } catch (error) {
      console.error("Error al procesar venta:", error);
    }
  };
  
  return (
    <button onClick={handleCheckout} disabled={isCheckingOut}>
      {isCheckingOut ? "Procesando..." : "Comprar"}
    </button>
  );
}
```

## 🔧 Configuración en Desarrollo

### 1. Configurar Variables de Entorno

```bash
cd web-nextjs
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Iniciar Servicios Backend

```bash
cd ..
docker-compose up -d
```

### 3. Iniciar Frontend

```bash
cd web-nextjs
npm install
npm run dev
```

### 4. Verificar Conexión

```bash
curl http://localhost:3000/api/health
```

## 🚀 Configuración en Producción

### 1. Configurar Cloudflare

Crear dominios en Cloudflare:
- `confimax.bitforges.com` -> IP del servidor
- Configurar SSL/TLS: Full (Strict)
- Activar Always Use HTTPS

### 2. Configurar Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://confimax.bitforges.com/api
```

### 3. Desplegar Frontend

```bash
npm run build
npm start
```

O usar Coolify para deployment automático.

## 📝 Endpoints Disponibles

### Auth Service
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/recover` - Recuperar contraseña
- `POST /api/auth/refresh` - Refrescar token

### Inventory Service
- `GET /api/inventory/products` - Listar productos
- `GET /api/inventory/products/:id` - Obtener producto
- `GET /api/inventory/categories` - Listar categorías
- `GET /api/inventory/products/search?q=` - Buscar productos

### Sales Service
- `POST /api/sales` - Crear venta
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta

### Customers Service
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obtener cliente
- `POST /api/customers` - Crear cliente

### Notifications Service
- `GET /api/notifications` - Listar notificaciones
- `POST /api/notifications/:id/read` - Marcar como leída

## ⚠️ Consideraciones de Seguridad

1. **TLS 1.3:** Configurar en Nginx para producción
2. **CORS:** Configurar orígenes permitidos en API Gateway
3. **Rate Limiting:** Ya implementado en API Gateway
4. **JWT:** Token almacenado en localStorage (considerar usar httpOnly cookies)
5. **HTTPS:** Obligatorio en producción

## 🐛 Troubleshooting

### Error: 401 Unauthorized
- Verificar que el token JWT es válido
- Verificar que el token se está enviando en el header
- Verificar que el token no ha expirado

### Error: 502 Bad Gateway
- Verificar que el API Gateway está corriendo
- Verificar que los microservicios están corriendo
- Verificar logs de Docker: `docker logs confimax-api-gateway`

### Error: Connection Refused
- Verificar que Nginx está corriendo en puerto 3000
- Verificar que la URL del API es correcta
- Verificar firewall del servidor

## 📚 Recursos Adicionales

- [Documentación del API Gateway](../../services/api-gateway/README.md)
- [Documentación de Seguridad](../../SEGURIDAD_CLOUDFLARE.md)
- [Documentación de Deploy](../../COOLIFY_DEPLOY.md)
