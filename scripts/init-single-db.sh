#!/bin/bash
# Inicialización de PostgreSQL con un solo database y 4 schemas
# Este enfoque permite Foreign Keys entre schemas

set -e

echo "=== Inicializando PostgreSQL - Single Database con 4 Schemas ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Habilitar extensión UUID
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Crear 4 schemas (equivalente a las 4 bases de datos anteriores)
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS inventory;
    CREATE SCHEMA IF NOT EXISTS sales;
    CREATE SCHEMA IF NOT EXISTS customers;
    
    -- Establecer search_path para facilitar consultas
    ALTER DATABASE $POSTGRES_DB SET search_path TO auth, inventory, sales, customers, public;
EOSQL

echo "=== Schemas creados ==="
echo "• auth      - Usuarios y autenticación"
echo "• inventory - Productos y categorías"
echo "• sales     - Ventas y facturación"
echo "• customers - Clientes y créditos"

# Función para ejecutar schema en un schema específico
run_schema() {
    local schema=$1
    local sql_file=$2
    
    if [ -f "$sql_file" ]; then
        echo "Aplicando esquema a schema '$schema'..."
        # Modificar el SQL para usar el schema correcto
        sed "s/CREATE TABLE IF NOT EXISTS /CREATE TABLE IF NOT EXISTS ${schema}./g" "$sql_file" | \
        sed "s/CREATE INDEX /CREATE INDEX ${schema}_/g" | \
        sed "s/REFERENCES /REFERENCES /g" | \
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"
    else
        echo "⚠️  Archivo $sql_file no encontrado. Saltando..."
    fi
}

# Aplicar cada schema
# Nota: Los archivos se montan en /docker-entrypoint-initdb.d/
run_schema "auth" "/docker-entrypoint-initdb.d/auth-schema.sql"
run_schema "inventory" "/docker-entrypoint-initdb.d/inventory-schema.sql"
run_schema "sales" "/docker-entrypoint-initdb.d/sales-schema.sql"
run_schema "customers" "/docker-entrypoint-initdb.d/customers-schema.sql"

echo "=== Inicialización completada ==="
echo ""
echo "📊 Estructura final:"
echo "   Database: $POSTGRES_DB"
echo "   Schemas:  auth, inventory, sales, customers"
echo ""
echo "🔌 Conexión:"
echo "   host: postgres"
echo "   port: 5432"
echo "   database: $POSTGRES_DB"
echo "   schemas: auth, inventory, sales, customers"
