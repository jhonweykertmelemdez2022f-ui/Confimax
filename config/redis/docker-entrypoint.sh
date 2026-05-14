#!/bin/sh
set -e

# ============================================================================
# Wrapper Redis + Redis Commander - Inicia ambos servicios
# ============================================================================

REDIS_PASS="${REDIS_PASSWORD:-Jackson1}"
REDIS_MEM="${REDIS_MAXMEMORY:-256mb}"

echo "=== Redis Confimax + Redis Commander ==="
echo "Max memory: $REDIS_MEM"
echo "Redis Commander: http://localhost:8081"

# Iniciar Redis en background
redis-server /etc/redis/redis.conf \
    --requirepass "$REDIS_PASS" \
    --maxmemory "$REDIS_MEM" \
    --maxmemory-policy allkeys-lru \
    --loglevel warning \
    --bind 0.0.0.0 &
REDIS_PID=$!

# Esperar a que Redis esté listo
echo "Esperando a Redis..."
sleep 5

# Configurar variables para Redis Commander
export REDIS_HOSTS="local:localhost:6379:0:${REDIS_PASS}"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
export REDIS_PASSWORD="${REDIS_PASS}"

echo "Iniciando Redis Commander en puerto 8081..."

# Iniciar Redis Commander escuchando en 0.0.0.0:8081
exec redis-commander --port 8081 --address 0.0.0.0
