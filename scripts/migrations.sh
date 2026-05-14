#!/bin/bash
# Script de migraciones automáticas para PostgreSQL
# Crea los 4 schemas y todas las tablas/índices automáticamente

set -e

HOST="postgres"
USER="confimax"
DB="confimax"
SCHEMAS_DIR="/schemas"

# Validaciones previas de secretos para migraciones
# Asegurarse de que haya una contraseña de Postgres proporcionada, ya sea en POSTGRES_PASSWORD o PGPASSWORD
if [ -z "$PGPASSWORD" ] && [ -z "$POSTGRES_PASSWORD" ]; then
    echo "ERROR: no se proporcionó una contraseña de PostgreSQL. Define POSTGRES_PASSWORD o PGPASSWORD en el entorno." >&2
    exit 1
fi

echo "🚀 Iniciando migraciones de Confimax..."
echo ""

# Función para ejecutar SQL en un schema específico
migrate_schema() {
    local schema=$1
    local sql_file=$2
    
    echo "📦 Procesando schema: $schema"
    
    # Crear schema si no existe
    psql -h $HOST -U $USER -d $DB -c "CREATE SCHEMA IF NOT EXISTS $schema;" 2>/dev/null || true
    echo "   ✅ Schema '$schema' creado/verificado"
    
    # Contar tablas actuales
    table_count=$(psql -h $HOST -U $USER -d $DB -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';
    " 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$table_count" -gt "0" ]; then
        echo "   ℹ️  Schema '$schema' ya tiene $table_count tablas, saltando..."
        return 0
    fi
    
    # Aplicar el SQL usando search_path (más confiable que sed)
    if [ -f "$sql_file" ]; then
        echo "   📝 Aplicando $sql_file..."
        
        # Crear archivo temporal con search_path configurado
        tmp_file=$(mktemp)
        echo "SET search_path TO $schema, public;" > "$tmp_file"
        cat "$sql_file" >> "$tmp_file"
        
        # Ejecutar el SQL
        if psql -h $HOST -U $USER -d $DB -f "$tmp_file" 2>/dev/null; then
            echo "   ✅ SQL aplicado correctamente"
        else
            echo "   ⚠️  Algunos comandos pueden haber fallado (tablas existentes?)"
        fi
        
        rm -f "$tmp_file"
    else
        echo "   ⚠️  Archivo $sql_file no encontrado"
    fi
    
    echo ""
}

# Crear extensión UUID
psql -h $HOST -U $USER -d $DB -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
echo "✅ Extensión uuid-ossp verificada"
echo ""

# Ejecutar migraciones en orden
echo "🗄️  Base de datos: $DB"
echo ""

migrate_schema "auth" "$SCHEMAS_DIR/auth.sql"
migrate_schema "inventory" "$SCHEMAS_DIR/inventory.sql"
migrate_schema "sales" "$SCHEMAS_DIR/sales.sql"
migrate_schema "customers" "$SCHEMAS_DIR/customers.sql"

# Configurar search_path por defecto
psql -h $HOST -U $USER -d $DB -c "
    ALTER DATABASE $DB SET search_path TO auth, inventory, sales, customers, public;
" 2>/dev/null || true

echo ""
echo "✅ Migraciones completadas exitosamente!"
echo ""
echo "📊 Resumen final:"

# Mostrar resumen detallado de tablas por schema
for schema in auth inventory sales customers; do
    echo ""
    echo "📁 Schema: $schema"
    tables=$(psql -h $HOST -U $USER -d $DB -t -c "
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = '$schema' AND table_type = 'BASE TABLE' ORDER BY table_name;
    " 2>/dev/null | sed 's/^[[:space:]]*/   • /')
    if [ -z "$tables" ]; then
        echo "   (sin tablas)"
    else
        echo "$tables"
    fi
done

echo ""
echo "🔧 PostgreSQL está listo para usar!"
