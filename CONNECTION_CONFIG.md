# 🔌 Configuración de Conexiones - Local vs Producción

## 📋 ÍNDICE
1. [Desarrollo Local](#desarrollo-local)
2. [Producción Coolify](#producción-coolify)
3. [Strings de Conexión](#strings-de-conexión)
4. [Variables de Entorno](#variables-de-entorno)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 🏠 DESARROLLO LOCAL

### URLs de Conexión Local

| Servicio | URL Externa (desde host) | URL Interna (entre contenedores) | Puerto |
|----------|-------------------------|----------------------------------|--------|
| **Frontend** | http://localhost:3000 | http://frontend:80 | 3000 |
| **Backend API** | http://localhost:3001 | http://backend:3001 | 3001 |
| **PostgreSQL** | localhost:5433 | postgres:5432 | 5433 |
| **Redis** | localhost:6380 | redis:6379 | 6380 |
| **MongoDB** | localhost:27018 | mongo:27017 | 27018 |
| **pgAdmin** | http://localhost:5050 | - | 5050 |

### 🔧 Docker Compose Local

```yaml
# docker-compose.local.yml
services:
  backend:
    environment:
      # Desde DENTRO del contenedor, usa el nombre del servicio
      - POSTGRES_HOST=postgres      # ✅ Correcto
      - POSTGRES_PORT=5432          # Puerto interno
      
      # NO uses localhost desde dentro del contenedor
      # - POSTGRES_HOST=localhost   # ❌ Incorrecto
      # - POSTGRES_PORT=5433        # ❌ Puerto externo
```

### 🔐 Variables de Entorno Local (.env)

```bash
# ============================================
# DESARROLLO LOCAL - .env.local
# ============================================

# Credenciales comunes
POSTGRES_PASSWORD=Jackson1
REDIS_PASSWORD=Jackson1
MONGO_PASSWORD=Jackson1
PGADMIN_PASSWORD=Jackson1
JWT_SECRET=dev-secret-key-12345

# URLs para aplicaciones externas (fuera de Docker)
# Usa localhost y puertos externos
EXTERNAL_DATABASE_URL=postgresql://confimax:Jackson1@localhost:5433/confimax?schema=auth
EXTERNAL_REDIS_URL=redis://:Jackson1@localhost:6380
EXTERNAL_MONGO_URI=mongodb://confimax:Jackson1@localhost:27018/confimax_notifications?authSource=admin
```

### 🖥️ Conexión desde tu PC (fuera de Docker)

```javascript
// Node.js / Prisma
const DATABASE_URL = "postgresql://confimax:Jackson1@localhost:5433/confimax?schema=auth";

// Redis
const REDIS_URL = "redis://:Jackson1@localhost:6380";

// MongoDB
const MONGO_URI = "mongodb://confimax:Jackson1@localhost:27018/confimax_notifications?authSource=admin";
```

```bash
# PostgreSQL CLI
psql postgresql://confimax:Jackson1@localhost:5433/confimax

# Redis CLI
redis-cli -h localhost -p 6380 -a Jackson1

# MongoDB CLI
mongosh "mongodb://confimax:Jackson1@localhost:27018/confimax_notifications?authSource=admin"
```

---

## 🌐 PRODUCCIÓN CON COOLIFY

### Dominios Configurados

| Servicio | Dominio Público | Tipo de Acceso |
|----------|----------------|----------------|
| **Frontend** | https://confimax.bitforges.com | Público (SSL) |
| **Backend API** | https://api-confimax.bitforges.com | Público (SSL) |
| **PostgreSQL** | postgres.confimax.bitforges.com | Solo red interna |
| **Redis** | redis.confimax.bitforges.com | Solo red interna |
| **MongoDB** | mongo.confimax.bitforges.com | Solo red interna |

### 🔒 Configuración de Red Interna vs Pública

```yaml
# docker-compose.coolify.yml
services:
  backend:
    environment:
      # === COMUNICACIÓN INTERNA (más rápida y segura) ===
      # Entre microservicios dentro del mismo Docker Compose
      - POSTGRES_HOST=postgres        # Nombre del contenedor
      - POSTGRES_PORT=5432            # Puerto interno
      - REDIS_HOST=redis              # Nombre del contenedor
      - REDIS_PORT=6379               # Puerto interno
      - MONGO_HOST=mongo              # Nombre del contenedor
      - MONGO_PORT=27017              # Puerto interno
      
      # Las apps externas conectan vía dominio público
      # Coolify maneja SSL automáticamente
      - REACT_APP_API_URL=https://api-confimax.bitforges.com
```

### 🔐 Variables de Entorno Producción (.env)

```bash
# ============================================
# PRODUCCIÓN - Coolify Secrets
# ============================================

# ⚠️ IMPORTANTE: Usa contraseñas seguras en producción
POSTGRES_PASSWORD=ProdPasswordSeguro123!
REDIS_PASSWORD=ProdPasswordSeguro456!
MONGO_PASSWORD=ProdPasswordSeguro789!
GRAFANA_PASSWORD=ProdPasswordSeguroGrafana!

# JWT Secret - mínimo 32 caracteres aleatorios
JWT_SECRET=TuSuperSecretJWT2024!@#$%^&*ABCDEFG123456

# === URLs de Bases de Datos (NO exponer públicamente) ===
# Estas URLs funcionan dentro del compose de Coolify
# PostgreSQL
DATABASE_URL=postgresql://confimax:ProdPasswordSeguro123!@postgres:5432/confimax?schema=auth

# Redis (con password)
REDIS_URL=redis://:ProdPasswordSeguro456!@redis:6379

# MongoDB
MONGO_URI=mongodb://confimax:ProdPasswordSeguro789!@mongo:27017/confimax_notifications?authSource=admin
```

---

## 🔗 STRINGS DE CONEXIÓN COMPLETOS

### PostgreSQL

```yaml
# === LOCAL ===
Host:     localhost
Port:     5433
User:     confimax
Password: Jackson1
Database: confimax
Schema:   auth

String:   postgresql://confimax:Jackson1@localhost:5433/confimax?schema=auth

# === PRODUCCIÓN (Coolify - Interna) ===
Host:     postgres          # Nombre del contenedor
Port:     5432              # Puerto interno
User:     confimax
Password: ${POSTGRES_PASSWORD}
Database: confimax

String:   postgresql://confimax:${POSTGRES_PASSWORD}@postgres:5432/confimax?schema=auth

# === PRODUCCIÓN (Coolify - Externa vía VPN/SSH) ===
Host:     postgres.confimax.bitforges.com
Port:     5432
User:     confimax
Password: ${POSTGRES_PASSWORD}
SSL:      require

String:   postgresql://confimax:${POSTGRES_PASSWORD}@postgres.confimax.bitforges.com:5432/confimax?sslmode=require
```

### Redis

```yaml
# === LOCAL ===
Host:     localhost
Port:     6380
Password: Jackson1

String:   redis://:Jackson1@localhost:6380

# === PRODUCCIÓN (Coolify - Interna) ===
Host:     redis
Port:     6379
Password: ${REDIS_PASSWORD}

String:   redis://:${REDIS_PASSWORD}@redis:6379

# CLI Local:
redis-cli -h localhost -p 6380 -a Jackson1

# CLI Producción (desde dentro del contenedor):
redis-cli -h redis -p 6379 -a ${REDIS_PASSWORD}
```

### MongoDB

```yaml
# === LOCAL ===
Host:     localhost
Port:     27018
User:     confimax
Password: Jackson1
Database: confimax_notifications
AuthDB:   admin

String:   mongodb://confimax:Jackson1@localhost:27018/confimax_notifications?authSource=admin

# === PRODUCCIÓN (Coolify - Interna) ===
Host:     mongo
Port:     27017
User:     confimax
Password: ${MONGO_PASSWORD}
Database: confimax_notifications

String:   mongodb://confimax:${MONGO_PASSWORD}@mongo:27017/confimax_notifications?authSource=admin
```

---

## ⚙️ VARIABLES DE ENTORNO POR SERVICIO

### Frontend (Nginx/React)

```bash
# === LOCAL ===
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001
PORT=3000

# === PRODUCCIÓN ===
NODE_ENV=production
REACT_APP_API_URL=https://api-confimax.bitforges.com
PORT=80
```

### Backend (Auth Service)

```bash
# === Configuración ===
NODE_ENV=production
PORT=3001

# === Seguridad ===
JWT_SECRET=TuSuperSecretJWT2024!@#$%^&*

# === PostgreSQL ===
# Opción A: Variables separadas (RECOMENDADO)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=confimax
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=confimax
POSTGRES_SCHEMA=auth

# Opción B: URL completa
DATABASE_URL=postgresql://confimax:${POSTGRES_PASSWORD}@postgres:5432/confimax?schema=auth

# === Redis ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# === MongoDB ===
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_USER=confimax
MONGO_PASSWORD=${MONGO_PASSWORD}
MONGO_DB=confimax_notifications
MONGO_URI=mongodb://confimax:${MONGO_PASSWORD}@mongo:27017/confimax_notifications?authSource=admin

# === URLs de otros microservicios ===
INVENTORY_SERVICE_URL=http://inventory-service:3002
SALES_SERVICE_URL=http://sales-service:3003
CUSTOMERS_SERVICE_URL=http://customers-service:3004
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3005
```

### PostgreSQL

```bash
POSTGRES_USER=confimax
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=confimax

# Configuración de rendimiento
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=512MB
POSTGRES_WORK_MEM=16MB
POSTGRES_MAINTENANCE_WORK_MEM=64MB
POSTGRES_MAX_CONNECTIONS=100
```

### Redis

```bash
# Configuración via command en docker-compose
redis-server \
  --appendonly yes \
  --requirepass ${REDIS_PASSWORD} \
  --maxmemory 512mb \
  --maxmemory-policy allkeys-lru \
  --save 60 1000 \
  --loglevel warning
```

### MongoDB

```bash
MONGO_INITDB_ROOT_USERNAME=confimax
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGODB_MEMORY_LIMIT=512M
```

---

## 🛡️ MEJORES PRÁCTICAS DE SEGURIDAD

### 1. **NO exponer bases de datos públicamente**

```yaml
# ❌ MAL - Expuesto al mundo
services:
  postgres:
    ports:
      - "5432:5432"  # Cualquiera puede intentar conectar

# ✅ BIEN - Solo red interna
services:
  postgres:
    # Sin ports - solo accesible dentro del compose
    networks:
      - confimax-prod
```

### 2. **Usar contraseñas fuertes en producción**

```bash
# ❌ MAL
POSTGRES_PASSWORD=Jackson1

# ✅ BIEN - Mínimo 16 caracteres, mixto
POSTGRES_PASSWORD=Pr0dP@ssw0rd!2024#Secure
```

### 3. **SSL/TLS en todas las conexiones públicas**

```yaml
# Coolify maneja SSL automáticamente
services:
  frontend:
    labels:
      - "coolify.domain=confimax.bitforges.com"
      - "coolify.ssl=true"  # ✅ SSL automático
```

### 4. **Variables de entorno como Secrets en Coolify**

En Coolify Dashboard:
1. Ve a tu proyecto → Environment Variables
2. Marca como **Secret**:
   - `POSTGRES_PASSWORD`
   - `REDIS_PASSWORD`
   - `MONGO_PASSWORD`
   - `JWT_SECRET`
3. Esto oculta los valores en los logs

### 5. **Conexión externa segura (para desarrollo/admin)**

```bash
# Opción A: SSH Tunnel (más seguro)
ssh -L 5433:localhost:5432 user@tu-servidor-coolify
# Luego conecta a localhost:5433

# Opción B: VPN
# Conecta via VPN al servidor, luego usa IP interna

# Opción C: No expongas, usa pgAdmin web en Coolify
```

### 6. **Firewall en el servidor**

```bash
# Solo permitir puertos necesarios
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 22/tcp      # SSH (para administración)

# NO abrir puertos de bases de datos
# sudo ufw allow 5432/tcp  # ❌ No hacer esto
# sudo ufw allow 6379/tcp  # ❌ No hacer esto
# sudo ufw allow 27017/tcp # ❌ No hacer esto
```

### 7. **Backup automático de bases de datos**

```yaml
# Servicio de backup en docker-compose.coolify.yml
services:
  postgres-backup:
    image: postgres:15-alpine
    command: >
      sh -c "
        while true; do
          pg_dump -h postgres -U confimax confimax > /backup/db-$(date +%Y%m%d).sql
          sleep 86400  # Cada 24 horas
        done
      "
    volumes:
      - ./backups:/backup
    networks:
      - confimax-prod
```

---

## 🚀 FLUJO DE DESARROLLO → PRODUCCIÓN

### Paso 1: Desarrollo Local

```bash
# 1. Copiar variables de ejemplo
cp .env.example .env.local

# 2. Editar .env.local con valores de desarrollo
notepad .env.local

# 3. Iniciar stack local
docker compose -f docker-compose.local.yml up -d

# 4. Verificar conexiones
psql postgresql://confimax:Jackson1@localhost:5433/confimax
redis-cli -h localhost -p 6380 -a Jackson1
```

### Paso 2: Preparar para Producción

```bash
# 1. Subir imágenes a DockerHub
docker push reiastora/confimax-auth:latest
# ... (todas las imágenes)

# 2. Configurar Coolify
# - Crear proyecto
# - Subir docker-compose.coolify.yml
# - Configurar secrets en el dashboard

# 3. Configurar dominios DNS
# confimax.bitforges.com → IP del servidor
# api-confimax.bitforges.com → IP del servidor
```

### Paso 3: Deploy en Coolify

1. Ve a Coolify Dashboard
2. Crea nuevo proyecto
3. Selecciona "Docker Compose"
4. Sube `docker-compose.coolify.yml`
5. Configura variables de entorno (Secrets)
6. Click "Deploy"

---

## 📞 RESUMEN RÁPIDO

| Escenario | PostgreSQL | Redis | MongoDB |
|-----------|------------|-------|---------|
| **Local (CLI)** | `localhost:5433` | `localhost:6380` | `localhost:27018` |
| **Local (Docker)** | `postgres:5432` | `redis:6379` | `mongo:27017` |
| **Prod (Interna)** | `postgres:5432` | `redis:6379` | `mongo:27017` |
| **Prod (Externa)** | ❌ No expuesto | ❌ No expuesto | ❌ No expuesto |

---

**¿Necesitas más detalles sobre alguna conexión específica?** 🔧
