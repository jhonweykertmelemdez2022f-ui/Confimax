# 🚀 Despliegue en Coolify

## 📋 Pre-requisitos

- Servidor con Coolify instalado
- Docker y Docker Compose en el servidor
- Acceso SSH al servidor

## 🔧 Paso 1: Crear Proyecto en Coolify

1. Ve a tu instancia de Coolify (ej: `https://coolify.tudominio.com`)
2. Click en **"Create Project"**
3. Nombre: `confimax`
4. Selecciona el servidor donde desplegar

## 📁 Paso 2: Subir Archivos

Sube estos archivos al servidor:

```
coolify-docker-compose.yml
.env
```

### Contenido del archivo `.env`:
```
POSTGRES_PASSWORD=TuPasswordSeguro123
REDIS_PASSWORD=TuPasswordSeguro123
MONGO_PASSWORD=TuPasswordSeguro123
PGADMIN_PASSWORD=TuPasswordSeguro123
PGADMIN_EMAIL=admin@edulearn.com
GRAFANA_PASSWORD=TuPasswordSeguro123
JWT_SECRET=TuJWTSecretSuperSeguro2024
```

> ⚠️ **IMPORTANTE**: Cambia todas las contraseñas por valores seguros en producción.

## 🐳 Paso 3: Configurar Servicio en Coolify

1. En el proyecto, click en **"Add Resource"**
2. Selecciona **"Docker Compose"**
3. Configuración:
   - **Name**: `confimax-app`
   - **Docker Compose Location**: `/path/to/coolify-docker-compose.yml`
   - **Environment**: Selecciona el archivo `.env`

## 🌐 Paso 4: Configurar Dominios

En Coolify, configura los dominios para cada servicio:

| Servicio | Dominio Ejemplo |
|----------|-----------------|
| nginx (app) | `app.tudominio.com` |
| pgAdmin | `pgadmin.tudominio.com` |
| Grafana | `grafana.tudominio.com` |

### Configuración de Proxy:

En `coolify-docker-compose.yml`, modifica los puertos por las variables de Coolify:

```yaml
nginx:
  ports:
    - "${COOLIFY_PORT:-3000}:80"
```

## 🚀 Paso 5: Desplegar

1. Click en **"Deploy"**
2. Espera a que Coolify descargue las imágenes y levante los contenedores
3. Verifica los logs en la sección "Logs"

## 🔍 Verificación Post-Deploy

### Verificar contenedores:
```bash
docker ps | grep confimax
```

### Verificar logs:
```bash
docker logs confimax-nginx
docker logs confimax-auth-service
```

### Health check:
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
```

## 📊 Monitoreo en Coolify

Coolify automáticamente:
- ✅ Reinicia contenedores caídos
- ✅ Gestiona certificados SSL
- ✅ Monitorea uso de recursos
- ✅ Muestra logs en tiempo real

## 🔄 Actualizar Imágenes

Cuando actualices el código y subas nuevas imágenes:

```bash
docker compose -f coolify-docker-compose.yml pull
docker compose -f coolify-docker-compose.yml up -d
```

O en Coolify:
1. Click en "Restart"
2. Selecciona "Pull latest images"

## ⚠️ Solución de Problemas

### Problema: Puerto ocupado
```bash
netstat -tlnp | grep 3000
```

### Problema: Permisos de volúmenes
```bash
sudo chown -R 999:999 /path/to/postgres-data
```

### Problema: Base de datos no inicializada
```bash
docker exec confimax-postgres psql -U confimax -d confimax -c "\dt"
```

## 📞 URLs de Acceso (Después del deploy)

| Servicio | URL Interna | URL Externa |
|----------|-------------|-------------|
| App | `http://localhost:3000` | `https://app.tudominio.com` |
| pgAdmin | `http://localhost:5050` | `https://pgadmin.tudominio.com` |
| Grafana | `http://localhost:3001` | `https://grafana.tudominio.com` |

## 🔐 Seguridad en Producción

1. ✅ Usa contraseñas fuertes en `.env`
2. ✅ Configura firewall (solo puertos 80, 443 abiertos)
3. ✅ Habilita SSL automático en Coolify
4. ✅ Deshabilita pgAdmin en producción si no es necesario
5. ✅ Configura backups automáticos de volúmenes

---

**¿Listo para desplegar?** 🚀
