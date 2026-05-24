# Confimax - Docker Setup

Este archivo contiene las instrucciones para ejecutar todo el stack de Confimax usando Docker y Docker Compose.

## Prerrequisitos

- Docker Desktop instalado (Windows/macOS) o Docker Engine (Linux)
- Docker Compose instalado (viene incluido con Docker Desktop)

## Servicios Incluidos

El `docker-compose.yml` incluye los siguientes servicios:

| Servicio               | Puerto | Descripción                          |
|------------------------|--------|--------------------------------------|
| PostgreSQL             | 5432   | Base de datos principal              |
| Redis                  | 6379   | Cache y colas de mensajes           |
| API Gateway            | 8080   | Gateway principal de la API          |
| Auth Service           | 3001   | Servicio de autenticación            |
| Inventory Service      | 3002   | Servicio de inventario               |
| Sales Service          | 3003   | Servicio de ventas                   |
| Customers Service      | 3004   | Servicio de clientes                 |
| Notifications Service  | 3005   | Servicio de notificaciones           |
| Fabiana Service        | 3006   | Servicio de chatbot Fabiana          |

## Cómo ejecutar

### 1. Iniciar todos los servicios
```bash
docker-compose up -d
```

Esto:
- Descarga las imágenes necesarias
- Crea y configura todos los contenedores
- Inicia los servicios en orden correcto (primero base de datos y cache)

### 2. Ver logs de los servicios
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service
```

### 3. Detener los servicios
```bash
docker-compose stop
```

### 4. Detener y eliminar contenedores
```bash
docker-compose down
```

### 5. Detener, eliminar y borrar volúmenes (borra datos)
```bash
docker-compose down -v
```

## Acceso a los servicios

- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:3001
- **Inventory Service**: http://localhost:3002
- **Sales Service**: http://localhost:3003
- **Customers Service**: http://localhost:3004
- **Notifications Service**: http://localhost:3005
- **Fabiana Service**: http://localhost:3006
- **PostgreSQL**: localhost:5432 (usuario: confimax, password: confimax123, db: confimax)
- **Redis**: localhost:6379

## Variables de Entorno

Las variables de entorno están configuradas en el `docker-compose.yml`. Para modificar:
1. Edita el archivo `docker-compose.yml`
2. Reinicia los servicios: `docker-compose restart`

## Construir imágenes personalizadas

Si necesitas reconstruir las imágenes de los servicios:

```bash
# Reconstruir todas las imágenes
docker-compose build

# Reconstruir un servicio específico
docker-compose build auth-service
```

## Healthchecks

Todos los servicios tienen healthchecks configurados. Ver el estado:

```bash
docker-compose ps
```

## Troubleshooting

### Un servicio no inicia
```bash
# Ver los logs del servicio
docker-compose logs <nombre-del-servicio>

# Verificar dependencias (postgres/redis)
docker-compose ps
```

### Error de conexión a la base de datos
Asegúrate de que PostgreSQL esté sano antes de los servicios:
```bash
docker-compose ps postgres
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker-compose up -d --build
```
