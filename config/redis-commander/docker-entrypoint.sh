#!/bin/sh
set -e

# ============================================================================
# Wrapper Redis Commander - Configura host dinámico de Redis
# ============================================================================

# Host de Redis configurable (default: confimax-redis)
REDIS_HOST="${REDIS_HOST:-confimax-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASS="${REDIS_PASSWORD:-Jackson1}"

echo "=== Redis Commander Confimax ==="
echo "Connecting to: ${REDIS_HOST}:${REDIS_PORT}"

# Configurar variables para redis-commander
export REDIS_HOSTS="local:${REDIS_HOST}:${REDIS_PORT}:0:${REDIS_PASS}"
export REDIS_HOST="${REDIS_HOST}"
export REDIS_PORT="${REDIS_PORT}"
export REDIS_PASSWORD="${REDIS_PASS}"

# Ejecutar entrypoint original
exec redis-commander
