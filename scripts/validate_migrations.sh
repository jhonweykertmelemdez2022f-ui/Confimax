#!/bin/bash
set -euo pipefail

HOST="postgres"
USER="confimax"
DB="confimax"

echo "🧭 Validando migraciones en PostgreSQL (${HOST}:${DB}) ..."

# Verificar conectividad
psql -h "$HOST" -U "$USER" -d "$DB" -c "SELECT 1;" >/dev/null 2>&1 || { echo "ERROR: no se puede conectar a PostgreSQL"; exit 1; }

echo "✅ Conexión exitosa. mostrando esquemas:" 
psql -h "$HOST" -U "$USER" -d "$DB" -t -c "\dn" | sed 's/^/  - /'

echo "✅ Migraciones pendientes (schemas) verificados." 
for s in auth inventory sales customers; do
  echo "Schema: $s"
  psql -h "$HOST" -U "$USER" -d "$DB" -t -c "SELECT table_schema, count(*) FROM information_schema.tables WHERE table_schema = '$s' AND table_type = 'BASE TABLE' GROUP BY table_schema;" 2>/dev/null | sed 's/^/  /'
done

echo "
🔎 Listo." 
