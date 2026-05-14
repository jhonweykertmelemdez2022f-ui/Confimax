# Configuración de Supabase - Confimax Farm

## Variables de entorno para Supabase

### Opción 1: DATABASE_URL (recomendado)

```bash
# En tu .env
DATABASE_URL="postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres?schema=public"
```

### Opción 2: Variables individuales

```bash
# En tu .env
POSTGRES_HOST=db.tlrliqbgtdplwdvbxqxv.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Jackwell2019*2424
POSTGRES_DB=postgres
POSTGRES_SSL=true
```

## Servicios actualizados

Los siguientes servicios ahora soportan conexión a Supabase:

- ✅ `auth-service`
- ✅ `inventory-service`
- ✅ `customers-service`
- ✅ `sales-service`

## Cambios realizados

1. **Configs**: Cada servicio ahora lee `DATABASE_URL` y soporta SSL automático
2. **Modelos**: Todos los modelos usan `connectionString` cuando `DATABASE_URL` está presente
3. **SSL**: Se activa automáticamente si el host contiene `supabase.co`

## Módulos compartidos

- `services/shared/database.js` - Cliente de base de datos universal
- `services/shared/supabase-client.js` - Cliente oficial de Supabase (opcional)

## Para conectar a Supabase

### 1. Actualizar .env

```bash
# Copiar ejemplo
cp .env.example .env

# Editar .env y agregar:
DATABASE_URL="postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres?schema=public"
```

### 2. Reiniciar servicios

```bash
# Local
docker compose restart

# O individual
cd services/inventory-service && npm start
```

## Notas

- El pool de conexiones usa `connectionTimeoutMillis: 5000` para conexiones externas
- SSL se configura con `rejectUnauthorized: false` para compatibilidad con Supabase
- Los servicios funcionan tanto con PostgreSQL local como con Supabase sin cambios de código
