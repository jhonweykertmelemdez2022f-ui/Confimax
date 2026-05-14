#!/bin/sh
set -e

# ============================================================================
# Wrapper Mongo Express - Configura host dinámico de MongoDB
# ============================================================================

# Host de MongoDB configurable (default: confimax-mongo)
MONGO_HOST="${MONGO_HOST:-confimax-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-confimax}"
MONGO_PASS="${MONGO_PASSWORD:-Jackson1}"

# Construir URL de conexión dinámica
export ME_CONFIG_MONGODB_URL="mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/?authSource=admin"

# Variables de auth para mongo-express
export ME_CONFIG_MONGODB_ADMINUSERNAME="${MONGO_USER}"
export ME_CONFIG_MONGODB_ADMINPASSWORD="${MONGO_PASS}"
export ME_CONFIG_BASICAUTH_USERNAME="${ME_CONFIG_BASICAUTH_USERNAME:-admin}"
export ME_CONFIG_BASICAUTH_PASSWORD="${ME_CONFIG_BASICAUTH_PASSWORD:-${MONGO_PASS}}"
export ME_CONFIG_SITE_BASEURL="${ME_CONFIG_SITE_BASEURL:-/}"

echo "=== Mongo Express Confimax ==="
echo "Connecting to: ${MONGO_HOST}:${MONGO_PORT}"
echo "URL: mongodb://${MONGO_USER}:****@${MONGO_HOST}:${MONGO_PORT}/?authSource=admin"

# Ejecutar entrypoint original
exec tini -- node app
