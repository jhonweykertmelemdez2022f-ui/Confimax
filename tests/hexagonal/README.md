# 🧪 Tests de Arquitectura Hexagonal

Este directorio contiene tests que verifican la arquitectura del sistema siguiendo el patrón **Ports and Adapters** (Arquitectura Hexagonal).

## 📐 Estructura de Arquitectura Hexagonal

```
tests/hexagonal/
├── Dockerfile                 # Contenedor Docker para tests
├── jest.config.js             # Configuración de Jest
├── setup.js                   # Setup global para tests
├── auth-service/              # Tests del servicio de autenticación
│   ├── domain/                # Tests de lógica de negocio pura
│   │   └── user.entity.test.js
│   ├── application/           # Tests de casos de uso
│   │   └── auth.usecase.test.js
│   └── infrastructure/        # Tests de adaptadores (BD, APIs)
│       └── user.repository.pg.test.js
└── integration/               # Tests de flujos completos
    └── multi-schema.integration.test.js
```

## 🗄️ Arquitectura de Base de Datos

El sistema usa **Single Database con 4 Schemas**:

```
PostgreSQL: postgres (Supabase)
├── Schema: auth       → users
├── Schema: inventory  → products, categories
├── Schema: sales      → sales, sale_items
└── Schema: customers  → customers, credits, credit_payments
```

Ventajas:
- ✅ Foreign Keys funcionan entre schemas
- ✅ Un solo backup
- ✅ Aislamiento lógico mantenido
- ✅ Permite JOINs entre microservicios

## 🚀 Ejecutar Tests

### Opción 1: Con Docker (Recomendado)

```bash
# Construir imagen (solo la primera vez o si hay cambios)
docker-compose build hexagonal-tests

# Ejecutar todos los tests hexagonales
docker-compose --profile test run --rm hexagonal-tests

# Watch mode (re-ejecuta cuando hay cambios)
docker-compose --profile test run --rm hexagonal-tests npx jest --config tests/hexagonal/jest.config.js --watch

# Ejecutar solo tests de dominio
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/auth-service/domain/ --config tests/hexagonal/jest.config.js

# Ejecutar solo tests de infraestructura
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/auth-service/infrastructure/ --config tests/hexagonal/jest.config.js

# Ejecutar solo tests de integración
docker-compose --profile test run --rm hexagonal-tests npx jest tests/hexagonal/integration/ --config tests/hexagonal/jest.config.js
```

### Opción 2: Local (sin Docker)

```bash
# Desde la raíz del proyecto
cd tests/hexagonal
npx jest --config jest.config.js
```

## 🔒 Conexión con Tailscale

Los tests pueden conectarse a servicios remotos de forma segura usando **Tailscale**:

1. Configura `TS_AUTHKEY` en tu archivo `.env`:
   ```env
   TS_AUTHKEY=tskey-auth-xxxxxxxxxxxxxxxx
   TS_HOSTNAME=confimax-hexagonal-tests
   ```

2. Los tests usarán Tailscale automáticamente para conectarse a:
   - Servicios backend remotos
   - Bases de datos en otros servidores
   - APIs internas

## 📊 Servicios Cloud Utilizados

Los tests están configurados para usar servicios cloud por defecto:

- **PostgreSQL**: Supabase (`aws-1-us-west-2.pooler.supabase.com`)
- **Redis**: Upstash (`good-iguana-119328.upstash.io`)
- **MongoDB**: MongoDB Atlas (`confimax.tedq2nv.mongodb.net`)

Las credenciales se configuran en `docker-compose.yml` y pueden sobrescribirse con variables de entorno.

## 🧪 Ejecutar Tests por Capa

```bash
# Solo tests de dominio (rápidos, sin BD)
npx jest domain/ --config tests/hexagonal/jest.config.js

# Tests de aplicación (con mocks)
npx jest application/ --config tests/hexagonal/jest.config.js

# Tests de infraestructura (requiere PostgreSQL)
npx jest infrastructure/ --config tests/hexagonal/jest.config.js

# Tests de integración (requiere todos los servicios)
npx jest integration/ --config tests/hexagonal/jest.config.js --runInBand
```

### Con cobertura

```bash
npx jest --coverage --config tests/hexagonal/jest.config.js
```

## 📝 Ejemplos de Tests

### Test de Dominio (sin dependencias)

```javascript
describe('Domain: User Entity', () => {
  test('debe validar usuario correctamente', () => {
    const user = { username: 'test', email: 'test@test.com', password: 'pass123' };
    const result = validateUser(user);
    expect(result.isValid).toBe(true);
  });
});
```

### Test de Infraestructura (con PostgreSQL real)

```javascript
describe('Infrastructure: PG Repository', () => {
  test('debe crear usuario en schema auth', async () => {
    const user = await userRepository.create({
      username: 'test',
      email: 'test@test.com',
      password: 'hashed'
    });
    expect(user.id).toBeDefined();
  });
});
```

## 🔧 Configuración

Las variables de entorno para tests están en `jest.config.js`:

```javascript
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_DB = 'confimax';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6380';
```

## 📊 Reportes

Los reportes de tests se generan en:
- `coverage/hexagonal/` - Cobertura de código
- `reports/junit-hexagonal.xml` - Resultados en formato JUnit

## 🐛 Debugging

Para ver logs detallados:

```bash
DEBUG=true npx jest --verbose
```

Para ejecutar un test específico:

```bash
npx jest -t "debe crear usuario en schema auth"
```

## 📚 Recursos

- [Arquitectura Hexagonal - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports and Adapters Pattern](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
- [Jest Documentation](https://jestjs.io/)

---

**Nota:** Los tests de integración requieren que todos los servicios estén disponibles. Usa `docker-compose up -d` antes de ejecutarlos.
