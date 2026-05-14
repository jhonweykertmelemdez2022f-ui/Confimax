# Guía de Testing - Backend Confimax

## Opciones para ejecutar tests

### 1. Test Runner UI (Interfaz Web) ⭐ RECOMENDADO
La forma más fácil de ejecutar tests desde el navegador.

```powershell
# Levantar el backend
docker-compose up -d backend

# Abrir en el navegador
start http://localhost:3006/api/tests
```

**Funcionalidades:**
- Ejecutar tests con un click
- Ver resultados en tiempo real
- Tests unitarios e integración
- Output raw de Jest
- Estadísticas de tests (pasaron/fallaron)

**Tests disponibles:**
- 🔐 Auth Unit Tests
- 📦 Inventory Unit Tests
- 💰 Sales Unit Tests
- 👥 Customers Unit Tests
- 🔔 Notifications Unit Tests
- 🔗 API Integration Tests

---

### 2. API Tester (Interfaz Web)
La forma más fácil de probar la API sin escribir código.

```powershell
# Levantar el backend
docker-compose up -d backend

# Abrir en el navegador
start http://localhost:3006/api/tester
```

**Funcionalidades:**
- Click en endpoint → autocompleta URL y body
- Login → guarda token automáticamente
- Respuestas con syntax highlighting
- Status badges (verde/rojo)

---

### 2. Tests con Docker (Jest)

#### Backend Tests (Unitarios e Integración)

```bash
# Construir imagen de tests (solo la primera vez)
docker-compose build backend-tests

# Ejecutar todos los tests
docker-compose --profile test run --rm backend-tests npm test

# Watch mode
docker-compose --profile test run --rm backend-tests npm run test:watch

# Solo tests unitarios
docker-compose --profile test run --rm backend-tests npx jest tests/unit/

# Solo tests de integración
docker-compose --profile test run --rm backend-tests npx jest tests/integration/
```

#### Tests de Arquitectura Hexagonal

```bash
# Construir imagen (solo la primera vez)
docker-compose build hexagonal-tests

# Ejecutar todos los tests hexagonales
docker-compose --profile test run --rm hexagonal-tests

# Watch mode
docker-compose --profile test run --rm hexagonal-tests npx jest --config tests/hexagonal/jest.config.js --watch

# Solo tests de dominio
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/auth-service/domain/

# Solo tests de infraestructura
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/auth-service/infrastructure/

# Solo tests de integración
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/integration/
```

---

### 3. Tests locales (sin Docker)

```bash
# Desde la raíz del proyecto, ir a backend
cd services/backend

# Instalar dependencias (incluyendo devDependencies para tests)
npm install

# Ejecutar tests
npm test

# Tests hexagonales (volver a raíz primero)
cd ../..
cd tests/hexagonal
npx jest --config jest.config.js
```

---

## 🔒 Conexión con Tailscale

Los tests pueden conectarse a servicios remotos de forma segura usando **Tailscale**:

1. Configura `TS_AUTHKEY` en tu archivo `.env`:
   ```env
   TS_AUTHKEY=tskey-auth-xxxxxxxxxxxxxxxx
   TS_HOSTNAME=confimax-tests
   ```

2. Los contenedores de tests usarán Tailscale para:
   - Acceder a servicios backend remotos
   - Conectarse a bases de datos en otros servidores
   - Comunicarse con APIs internas de forma segura

---

## Variables de entorno para tests

Crear archivo `services/backend/.env`:
```env
NODE_ENV=test
PORT=3006
JWT_SECRET=test_secret_key_for_testing
POSTGRES_HOST=aws-1-us-west-2.pooler.supabase.com
POSTGRES_PORT=5432
POSTGRES_USER=postgres.tlrliqbgtdplwdvbxqxv
POSTGRES_PASSWORD=Jackwell2019*2424
POSTGRES_DB=postgres
REDIS_URL=rediss://default:gQAAAAAAAdIgAAIgcDFhNDRkNmE3OTg5YjA0MDBlODE4MzQxMGY5NGVjNmU0Mg@good-iguana-119328.upstash.io:6379
MONGO_URL=mongodb+srv://confimax:jema2019@confimax.tedq2nv.mongodb.net/confimax_notifications
```

---

## Estructura de tests

```
services/backend/tests/
├── setup.js                 # Configuración global
├── unit/
│   ├── auth.test.js         # Tests de autenticación
│   ├── inventory.test.js    # Tests de inventario
│   ├── sales.test.js        # Tests de ventas
│   ├── customers.test.js    # Tests de clientes
│   └── notifications.test.js # Tests de notificaciones
└── integration/
    └── api.test.js          # Tests de integración HTTP
```

---

## Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check (sin auth) |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login (devuelve token) |
| GET | `/api/auth/me` | Info usuario (requiere token) |
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/categories` | Listar categorías |
| GET | `/api/sales` | Listar ventas |
| POST | `/api/sales` | Crear venta |
| GET | `/api/sales/summary/daily` | Resumen diario |
| GET | `/api/customers` | Listar clientes |
| POST | `/api/customers` | Crear cliente |
| GET | `/api/notifications` | Listar notificaciones |
| POST | `/api/notifications` | Crear notificación |

---

## Flujo recomendado

1. **Health Check**: Verifica conexión a BDs
2. **Login**: Obtén tu token JWT
3. **Prueba endpoints protegidos**: El token se guarda automáticamente

---

## Troubleshooting

### Docker no inicia
```powershell
docker system prune -f
docker-compose build --no-cache backend
```

### Tests fallan por conexión
- Verifica que las credenciales de Supabase/Upstash/MongoDB sean correctas
- Verifica conexión a internet

### Puerto ocupado
```powershell
# Cambiar puerto en .env
BACKEND_PORT=3007
```
