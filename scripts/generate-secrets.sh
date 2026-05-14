#!/bin/bash
# Script para generar contraseñas seguras automáticamente
# Uso: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generando secretos seguros para Confimax..."
echo ""

# Función para generar string aleatorio
generate_secret() {
    openssl rand -base64 32 | tr -d '=+/' | cut -c1-$1
}

# Generar secretos
JWT_SECRET=$(generate_secret 32)
POSTGRES_PASSWORD=$(generate_secret 24)
REDIS_PASSWORD=$(generate_secret 24)
MONGO_PASSWORD=$(generate_secret 24)
PGADMIN_PASSWORD=$(generate_secret 16)

echo "✅ Secretos generados:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo "MONGO_PASSWORD=$MONGO_PASSWORD"
echo "PGADMIN_PASSWORD=$PGADMIN_PASSWORD"
echo ""

# Si existe .env, hacer backup
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Backup de .env anterior creado"
fi

# Crear nuevo .env seguro
cat > .env << EOF
# ============================================
# 🔒 ARCHIVO GENERADO AUTOMÁTICAMENTE
# Fecha: $(date)
# NO compartir este archivo ni subirlo a git
# ============================================

NODE_ENV=production

# 🔐 JWT Secret
JWT_SECRET=$JWT_SECRET

# 🐘 PostgreSQL
POSTGRES_USER=confimax
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=confimax

# Configuración de memoria
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=512MB
POSTGRES_WORK_MEM=16MB
POSTGRES_MAINTENANCE_WORK_MEM=64MB
POSTGRES_MAX_CONNECTIONS=100

# MongoDB
MONGO_MEMORY_LIMIT=512M
MONGO_CACHE_SIZE=0.25
MONGO_PASSWORD=$MONGO_PASSWORD

# Redis
REDIS_MEMORY_LIMIT=256M
REDIS_MAXMEMORY=256mb
REDIS_PASSWORD=$REDIS_PASSWORD

# pgAdmin
PGADMIN_EMAIL=admin@confimax.com
PGADMIN_PASSWORD=$PGADMIN_PASSWORD
PGADMIN_PORT=5050
EOF

echo "✅ Archivo .env creado con secretos seguros"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Revisa el archivo .env generado"
echo "   2. NUNCA subas .env a git (debe estar en .gitignore)"
echo "   3. Guarda estas contraseñas en un lugar seguro"
echo "   4. Para producción, considera usar Docker Secrets o un Vault"
echo ""
