#!/bin/bash
set -e

# ============================================================================
# Wrapper para PostgreSQL - Configura acceso remoto ANTES de iniciar
# ============================================================================

# Si pg_hba.conf existe, asegurar que permita conexiones externas
if [ -f "$PGDATA/pg_hba.conf" ]; then
    if ! grep -q "0.0.0.0/0" "$PGDATA/pg_hba.conf" 2>/dev/null; then
        echo "host all all 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"
        echo "✅ Configurado: acceso remoto en pg_hba.conf"
    fi
fi

# Si postgresql.conf existe, asegurar listen_addresses
if [ -f "$PGDATA/postgresql.conf" ]; then
    if ! grep -q "^listen_addresses = '\*'" "$PGDATA/postgresql.conf" 2>/dev/null; then
        sed -i "/^#listen_addresses/s/^#//" "$PGDATA/postgresql.conf" 2>/dev/null || true
        if ! grep -q "^listen_addresses" "$PGDATA/postgresql.conf" 2>/dev/null; then
            echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
        fi
        echo "✅ Configurado: listen_addresses = '*'"
    fi
fi

# Ejecutar el entrypoint original de PostgreSQL
exec /usr/local/bin/docker-entrypoint.sh "$@"
