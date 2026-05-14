#!/bin/bash
set -e

# ============================================================================
# Wrapper MongoDB + Mongo Express - Inicia ambos servicios
# ============================================================================

MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-confimax}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-Jackson1}"
MONGO_LIMIT="${MONGO_MEMORY_LIMIT:-512M}"
MONGO_CACHE="${MONGO_CACHE_SIZE:-0.25}"

echo "=== MongoDB Confimax + Mongo Express ==="
echo "Usuario: $MONGO_USER"
echo "Límite memoria: $MONGO_LIMIT"
echo "Cache size: ${MONGO_CACHE}GB"
echo "Mongo Express: http://localhost:8081"

# Actualizar config con valores de entorno
sed -i "s|dbPath: .*|dbPath: /data/db|" /etc/mongod.conf
sed -i "s|cacheSizeGB: .*|cacheSizeGB: $MONGO_CACHE|" /etc/mongod.conf

# PASO 1: Iniciar MongoDB SIN auth para crear usuario
echo "Iniciando MongoDB sin auth para crear usuario..."
mongod --config /etc/mongod.conf \
    --bind_ip_all \
    --wiredTigerCacheSizeGB "$MONGO_CACHE" &
MONGO_PID=$!

# Esperar a que MongoDB esté listo
echo "Esperando a MongoDB..."
for i in {1..30}; do
    if mongosh --quiet --eval 'db.runCommand("ping").ok' 2>/dev/null; then
        echo "MongoDB está listo después de $i intentos"
        break
    fi
    echo "Intento $i: MongoDB no listo, esperando..."
    sleep 2
done

# PASO 2: Crear usuario admin si no existe
echo "Verificando usuario admin..."
if ! mongosh --quiet --eval "db.getSiblingDB('admin').getUser('$MONGO_USER')" 2>/dev/null | grep -q "_id"; then
    echo "Creando usuario admin: $MONGO_USER"
    mongosh --quiet --eval "
        db.getSiblingDB('admin').createUser({
            user: '$MONGO_USER',
            pwd: '$MONGO_PASS',
            roles: [ { role: 'root', db: 'admin' } ]
        })
    "
    echo "Usuario admin creado"
else
    echo "Usuario admin ya existe"
fi

# PASO 3: Detener MongoDB y reiniciar con auth
echo "Reiniciando MongoDB con auth..."
kill $MONGO_PID 2>/dev/null || true
sleep 3

mongod --config /etc/mongod.conf \
    --auth \
    --bind_ip_all \
    --wiredTigerCacheSizeGB "$MONGO_CACHE" &
MONGO_PID=$!

# Esperar a que MongoDB con auth esté listo
echo "Esperando a MongoDB con auth..."
for i in {1..30}; do
    if mongosh --quiet --username "$MONGO_USER" --password "$MONGO_PASS" --authenticationDatabase admin --eval 'db.runCommand("ping").ok' 2>/dev/null; then
        echo "MongoDB con auth está listo después de $i intentos"
        break
    fi
    sleep 2
done

# PASO 4: Configurar variables para Mongo Express
export ME_CONFIG_MONGODB_URL="mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:27017/?authSource=admin"
export ME_CONFIG_MONGODB_ADMINUSERNAME="${MONGO_USER}"
export ME_CONFIG_MONGODB_ADMINPASSWORD="${MONGO_PASS}"
export ME_CONFIG_BASICAUTH_USERNAME="admin"
export ME_CONFIG_BASICAUTH_PASSWORD="${MONGO_PASS}"
export ME_CONFIG_SITE_BASEURL="/"
export ME_CONFIG_SITE_PORT="8081"
export ME_CONFIG_SITE_BINDIP="0.0.0.0"

echo "Iniciando Mongo Express en puerto 8081..."

# Iniciar Mongo Express escuchando en 0.0.0.0:8081
exec node /usr/lib/node_modules/mongo-express/app.js --port 8081 --bind_ip 0.0.0.0
