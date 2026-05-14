# 🚀 Guía de Deploy en Coolify

## MÉTODO 1: Sin Dominio (Recomendado - Sin problemas SSL)

### Paso 1: Subir archivo a Coolify

1. Ve a **Coolify Dashboard** → **Projects**
2. Clic en **"Add Resource"**
3. Selecciona **"Docker Compose"**
4. Sube el archivo: `docker-compose.pgadmin-containers.yml`

### Paso 2: Configuración (NO agregar dominio)

- **Name**: `confimax-postgres-pgadmin`
- **Domain**: **DEJAR VACÍO** (sin dominio)
- El puerto `5050` se expondrá automáticamente

### Paso 3: Variables de Entorno

Agrega en **Environment Variables**:

```bash
POSTGRES_USER=confimax_produccion
POSTGRES_PASSWORD=Jackson1
POSTGRES_DB=confimax_admin
PGADMIN_EMAIL=admin@edulearn.com
PGADMIN_PASSWORD=Jackson1
```

### Paso 4: Deploy

Clic en **"Deploy"**

### Paso 5: Acceso

Después del deploy:

```
http://IP_DE_TU_SERVIDOR:5050
```

**Credenciales:**
- Email: `admin@edulearn.com`
- Password: `Jackson1`

El servidor PostgreSQL ya aparecerá configurado como "Confimax PostgreSQL".

---

## MÉTODO 2: Con Dominio (Si quieres URL bonita)

### Paso 1: Subir archivo

Igual que arriba, pero usa: `docker-compose.coolify-pgadmin.yml`

### Paso 2: Configuración en Coolify

- **Domain**: `admin.confimax.bitforges.com`
- **Port**: `80`
- **SSL**: Enable (Let's Encrypt)

### Paso 3: Configurar DNS en Cloudflare

En **Cloudflare Dashboard**:
- **Type**: A
- **Name**: `admin`
- **Content**: IP_DE_TU_SERVIDOR_COOLIFY
- **Proxy**: ON (naranja)

### Paso 4: SSL/TLS en Cloudflare

Ve a **SSL/TLS → Overview**:
- Selecciona: **Full** (no Strict)

### Paso 5: Deploy y esperar

Clic en **Deploy**, espera 2-5 minutos para que genere el certificado SSL.

---

## 🔍 Verificación

Después del deploy, verifica que corren:

```bash
docker ps | grep confimax
```

Debe mostrar:
- `confimax-postgres`
- `confimax-pgadmin`

---

## ⚠️ Solución de Problemas

### Si pgAdmin no aparece:
```bash
docker logs confimax-pgadmin
```

### Si no hay conexión:
```bash
# Verificar red Docker
docker network ls
docker network inspect pgadmin-network
```

### Si SSL falla (Método 2):
Cambia Cloudflare SSL a **"Flexible"** temporalmente o usa **Método 1**.
