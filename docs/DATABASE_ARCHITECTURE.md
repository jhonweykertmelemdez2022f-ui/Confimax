# 🏗️ Arquitectura de Datos - Plataforma Educativa

## Resumen de Arquitectura Multi-Base de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATAFORMA EDUCATIVA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   🐘 PostgreSQL │  │   📊 MongoDB    │  │   ⚡ Redis      │  │
│  │   (Prisma ORM)  │  │   (Mongoose)    │  │   (ioredis)     │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  │
│  │                 │  │                 │  │                 │  │
│  │ • Users         │  │ • Logs          │  │ • Sesiones      │  │
│  │ • Courses       │  │ • Eventos       │  │ • Caché         │  │
│  │ • Enrollments   │  │ • Auditoría     │  │ • Rate Limit    │  │
│  │ • Reviews       │  │ • Errores       │  │ • Stats         │  │
│  │ • Resources     │  │                 │  │ • Tokens        │  │
│  │ • Forum         │  │                 │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  │ Consistencia    │  │ Alta Escritura  │  │ Alta Velocidad│  │
│  │ ACID            │  │ Flexible        │  │ TTL             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparativa de Tecnologías

| Aspecto | PostgreSQL | MongoDB | Redis |
|---------|------------|---------|-------|
| **Uso Principal** | Datos transaccionales | Logs y eventos | Caché y sesiones |
| **Persistencia** | Permanente | Permanente (TTL opcional) | Volátil (TTL) |
| **Esquema** | Estricto (Prisma) | Flexible (Mongoose) | Key-Value |
| **Consultas** | SQL complejas | JSON/Documentos | Keys, Sets, Hashes |
| **Escritura** | ACID | Alta throughput | Ultra rápida |
| **Lectura** | Índices B-Tree | Índices de documentos | Memoria (sub-ms) |

---

## 🐘 PostgreSQL - Datos Principales (Prisma ORM)

### Modelos Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL SCHEMA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Users     │  │  Categories  │  │   Courses    │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │          │
│  │ email (UK)   │  │ name         │  │ title        │          │
│  │ passwordHash │  │ slug (UK)    │  │ slug (UK)    │          │
│  │ firstName    │  │ description  │  │ description  │          │
│  │ lastName     │  │ type         │  │ price        │          │
│  │ role (enum)  │  └──────────────┘  │ mentor_id FK │────────┐ │
│  │ avatarUrl    │                    │ category_id  │─────┐  │ │
│  │ emailVerified│                    │ isPublished  │     │  │ │
│  │ createdAt    │                    └──────────────┘     │  │ │
│  └──────────────┘                                         │  │ │
│         │                                                 │  │ │
│         │ 1:N                                             │  │ │
│         ▼                                                 │  │ │
│  ┌──────────────────┐                                     │  │ │
│  │ SocialAccounts   │                                     │  │ │
│  ├──────────────────┤                                     │  │ │
│  │ id (PK)          │                                     │  │ │
│  │ user_id FK       │                                     │  │ │
│  │ provider         │                                     │  │ │
│  │ provider_id      │                                     │  │ │
│  └──────────────────┘                                     │  │ │
│                                                           │  │ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │ │
│  │ Enrollments  │  │   Reviews    │  │  Resources   │    │  │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤    │  │ │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │    │  │ │
│  │ user_id FK ──┼──┼─── user_id   │  │ title        │    │  │ │
│  │ course_id FK─┼──┼── course_id  │  │ file_url     │    │  │ │
│  │ pricePaid    │  │ rating (1-5) │  │ file_type    │    │  │ │
│  │ status       │  │ comment      │  │ category_id ─┼────┘  │ │
│  └──────────────┘  └──────────────┘  │ uploaded_by ─┼───────┘ │
│                                      └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ForumCategories│ │ ForumTopics  │  │ ForumReplies │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │          │
│  │ name         │  │ title        │  │ content      │          │
│  │ slug (UK)    │  │ category_id ─┼──┼─── topic_id  │          │
│  │ color        │  │ author_id    │  │ author_id    │          │
│  └──────────────┘  │ isPinned     │  │ isSolution   │          │
│                    └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Scripts Prisma

```bash
# Generar cliente Prisma
npm run db:generate

# Crear migración
npm run db:migrate

# Aplicar migraciones en producción
npm run db:deploy

# Poblar base de datos
npm run db:seed

# Interfaz visual
npm run db:studio
```

---

## 📊 MongoDB - Logs y Eventos (Mongoose)

### Esquema de Logs

```javascript
{
  level: "info" | "warn" | "error" | "fatal",  // Nivel de severidad
  service: "auth" | "courses" | "forum" | ..., // Servicio origen
  action: "login_success" | "enroll" | ...,     // Acción realizada
  userId: "uuid-string",                        // Usuario (opcional)
  session: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "sess_xxx"
  },
  details: { ... },                              // Datos específicos
  error: {                                       // Solo para errores
    message: "...",
    stack: "...",
    code: "..."
  },
  timestamp: ISODate("2024-01-15T10:30:00Z"),
  tags: ["auth", "login", "success"]            // Para búsquedas
}
```

### Colecciones

| Colección | Propósito | TTL |
|-----------|-----------|-----|
| `logs` | Eventos de aplicación | 90 días |
| `audit` | Auditoría de cambios críticos | 1 año |
| `errors` | Errores y excepciones | 30 días |
| `metrics` | Métricas de performance | 7 días |

### Ejemplo de Uso

```javascript
// Log simple
await Log.logAuth(userId, 'login_success', details, session);

// Log de error
await Log.logError('courses', error, { userId, action: 'get_course' });

// Consultar logs
const recentErrors = await Log.find({
  level: 'error',
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ timestamp: -1 });
```

---

## ⚡ Redis - Caché y Rate Limiting (ioredis)

### Estrategias de Caché

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA CACHE-ASIDE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. READ:                                                     │
│      ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│      │  App    │───▶│  Redis  │───▶│  Miss?  │                 │
│      └─────────┘    └─────────┘    └────┬────┘                 │
│                                           │                      │
│                                           ▼                      │
│   2. DATABASE FETCH:                   ┌─────────┐             │
│                                        │PostgreSQL│             │
│                                        └────┬────┘             │
│                                             │                    │
│                                             ▼                    │
│   3. CACHE UPDATE:                      ┌─────────┐            │
│                                         │  Redis  │◀────────    │
│                                         └─────────┘            │
│                                                                 │
│   4. RETURN:                                                   │
│      ┌─────────┐    ┌─────────┐                                 │
│      │  App    │◀───│  Data   │                                 │
│      └─────────┘    └─────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Keys

| Patrón | Descripción | TTL |
|--------|-------------|-----|
| `user:{id}` | Datos de usuario | 5 min |
| `session:{id}` | Sesión activa | 1 hora |
| `course:{id}` | Detalle de curso | 10 min |
| `courses:list:*` | Listados de cursos | 3 min |
| `enrollments:user:{id}` | Inscripciones del usuario | 5 min |
| `forum:topic:{id}` | Tema del foro | 3 min |
| `forum:topics:*` | Listados de temas | 2 min |
| `search:*` | Resultados de búsqueda | 5 min |
| `passwordreset:{hash}` | Token de reset | 15 min |
| `ratelimit:{id}` | Contador rate limit | Variable |
| `stats:daily:*` | Estadísticas diarias | 7 días |

### Rate Limiting

```javascript
// Verificar límite de requests
const limit = await cacheService.checkRateLimit(identifier, 100, 60);
// 100 requests por minuto

// Rate limiting específico
await cacheService.checkAuthRateLimit(ip);      // 5 intentos/5min
await cacheService.checkApiRateLimit(userId);   // 1000 requests/min
```

---

## 🔄 Flujos de Datos Típicos

### 1. Login de Usuario

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Cliente │───▶│   App   │───▶│  Redis  │───▶│  Check  │
└─────────┘    └─────────┘    └─────────┘    │  Rate   │
                                             │  Limit  │
                                             └────┬────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Session │◀───│  Redis  │◀───│  Valid  │◀───│PostgreSQL│
│  Token  │    │ (store) │    │Password │    │  (User)  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │
     ▼
┌─────────┐
│ MongoDB │ (log login_success)
└─────────┘
```

### 2. Ver Curso

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Cliente │───▶│   App   │───▶│  Redis  │───▶│  Hit?   │
└─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                  │
                              ┌────────┐         │ Sí
                              │  Cache │◀────────┘
                              │  Hit   │
                              └───┬────┘
                                  │
                                  ▼
                              ┌─────────┐
                              │ Cliente │
                              └─────────┘

                              No ──▶ PostgreSQL (Prisma)
                                      │
                                      ▼
                                   ┌─────────┐
                                   │  Redis  │ (almacenar)
                                   └─────────┘
                                      │
                                      ▼
                                   ┌─────────┐
                                   │ MongoDB │ (log cache_miss)
                                   └─────────┘
```

### 3. Crear Inscripción

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Cliente │───▶│   App   │───▶│  Redis  │───▶│  Check  │
└─────────┘    └─────────┘    └─────────┘    │  Rate   │
                                             │  Limit  │
                                             └────┬────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Cache  │◀───│  Redis  │◀───│  Create │◀───│PostgreSQL│
│Invalid  │    │ (del)   │    │Enrollment│   │(Prisma) │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                                                  ▼
                                             ┌─────────┐
                                             │ MongoDB │ (log enroll)
                                             └─────────┘
```

---

## 📋 Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Esquema Prisma ORM |
| `prisma/schema.sql` | SQL DDL equivalente |
| `prisma/seed.js` | Datos de ejemplo |
| `services/notifications-service/models/log.model.js` | Modelo MongoDB |
| `services/notifications-service/services/cache.service.js` | Servicio Redis |
| `services/notifications-service/examples/usage-example.js` | Ejemplos de uso |

---

## 🚀 Comandos de Despliegue

```bash
# 1. Iniciar todos los servicios
docker-compose up -d

# 2. Aplicar migraciones Prisma
cd web
npm run db:migrate

# 3. Poblar con datos de ejemplo
npm run db:seed

# 4. Verificar servicios
docker-compose ps

# 5. Health check
curl http://localhost:3000/health
```

---

## 📈 Monitoreo

### PostgreSQL
- **pgAdmin**: http://localhost:5050
- Query performance: `pg_stat_statements`

### MongoDB
- Logs aggregations por tipo
- Queries por índices
- Storage por colección

### Redis
- Memory usage: `INFO memory`
- Hit/Miss ratio: `INFO stats`
- Connected clients: `INFO clients`

---

**¿Necesitas algún ajuste o servicio API adicional?**
