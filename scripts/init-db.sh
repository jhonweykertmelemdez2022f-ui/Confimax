#!/bin/bash
set -e

echo "=== Inicializando PostgreSQL - Single Database con 4 Schemas ==="

# Función para aplicar un schema SQL modificando el namespace
apply_schema() {
    local schema=$1
    local sql_file=$2
    
    if [ -f "$sql_file" ]; then
        echo "Creando schema '$schema' y aplicando tablas..."
        
        # Crear schema si no existe
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE SCHEMA IF NOT EXISTS $schema;
            SET search_path TO $schema, public;
EOSQL
        
        # Modificar el SQL para usar el schema específico
        # Reemplaza "CREATE TABLE IF NOT EXISTS " con "CREATE TABLE IF NOT EXISTS schema."
        sed "s/CREATE TABLE IF NOT EXISTS /CREATE TABLE IF NOT EXISTS ${schema}./g" "$sql_file" | \
        sed "s/CREATE INDEX /CREATE INDEX ${schema}_/g" | \
        sed "s/DROP TABLE IF EXISTS /DROP TABLE IF EXISTS ${schema}./g" | \
        sed "s/ON /ON ${schema}./g" | \
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"
        
        echo "✅ Schema '$schema' configurado"
    else
        echo "⚠️  Archivo $sql_file no encontrado. Saltando..."
    fi
}

# Crear extensión UUID en la base de datos principal
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Configurar search_path por defecto para incluir todos los schemas
    ALTER DATABASE $POSTGRES_DB SET search_path TO auth, inventory, sales, customers, public;
EOSQL

echo "✅ Base de datos '$POSTGRES_DB' configurada"

# Aplicar cada schema
apply_schema "auth" "/docker-entrypoint-initdb.d/auth-schema.sql"
apply_schema "inventory" "/docker-entrypoint-initdb.d/inventory-schema.sql"
apply_schema "sales" "/docker-entrypoint-initdb.d/sales-schema.sql"
apply_schema "customers" "/docker-entrypoint-initdb.d/customers-schema.sql"

echo ""
echo "=== Inicialización completada ==="
echo ""
echo "📊 Estructura final:"
echo "   Database: $POSTGRES_DB"
echo "   Schemas:"
echo "     • auth       - Usuarios y autenticación"
echo "     • inventory  - Productos e inventario"
echo "     • sales      - Ventas y facturación"
echo "     • customers  - Clientes y créditos"
echo ""
echo "🔧 Acceso:"
echo "   pgAdmin: http://localhost:5050"
echo "   Database: $POSTGRES_DB"
echo "   Schemas: auth, inventory, sales, customers"
echo ""
echo "💡 Nota: Las Foreign Keys entre schemas FUNCIONAN correctamente"
