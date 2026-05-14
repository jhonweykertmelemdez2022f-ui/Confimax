#!/bin/bash
# Script de entrada personalizado para PostgreSQL
# Este script se ejecuta DESPUÉS de que el entrypoint oficial de PostgreSQL ha inicializado la base de datos
# y se ejecuta como el usuario postgres (no root)

set -e

echo "=== Configurando PostgreSQL según variables de entorno ==="

# Función para actualizar configuración de PostgreSQL según variables de entorno
update_postgres_config() {
    CONF_FILE="$PGDATA/postgresql.conf"

    # Si existe el archivo de configuración personalizado, copiarlo
    if [ -f "/etc/postgresql/postgresql.conf" ]; then
        echo "Copiando configuración personalizada..."
        cp /etc/postgresql/postgresql.conf "$CONF_FILE"
    fi

    # Actualizar configuraciones de memoria si están definidas
    if [ -n "$POSTGRES_SHARED_BUFFERS" ]; then
        sed -i "s/^shared_buffers = .*/shared_buffers = $POSTGRES_SHARED_BUFFERS/" "$CONF_FILE" 2>/dev/null || echo "shared_buffers = $POSTGRES_SHARED_BUFFERS" >> "$CONF_FILE"
        echo "Configurado: shared_buffers = $POSTGRES_SHARED_BUFFERS"
    fi

    if [ -n "$POSTGRES_EFFECTIVE_CACHE_SIZE" ]; then
        sed -i "s/^effective_cache_size = .*/effective_cache_size = $POSTGRES_EFFECTIVE_CACHE_SIZE/" "$CONF_FILE" 2>/dev/null || echo "effective_cache_size = $POSTGRES_EFFECTIVE_CACHE_SIZE" >> "$CONF_FILE"
        echo "Configurado: effective_cache_size = $POSTGRES_EFFECTIVE_CACHE_SIZE"
    fi

    if [ -n "$POSTGRES_WORK_MEM" ]; then
        sed -i "s/^work_mem = .*/work_mem = $POSTGRES_WORK_MEM/" "$CONF_FILE" 2>/dev/null || echo "work_mem = $POSTGRES_WORK_MEM" >> "$CONF_FILE"
        echo "Configurado: work_mem = $POSTGRES_WORK_MEM"
    fi

    if [ -n "$POSTGRES_MAINTENANCE_WORK_MEM" ]; then
        sed -i "s/^maintenance_work_mem = .*/maintenance_work_mem = $POSTGRES_MAINTENANCE_WORK_MEM/" "$CONF_FILE" 2>/dev/null || echo "maintenance_work_mem = $POSTGRES_MAINTENANCE_WORK_MEM" >> "$CONF_FILE"
        echo "Configurado: maintenance_work_mem = $POSTGRES_MAINTENANCE_WORK_MEM"
    fi

    if [ -n "$POSTGRES_MAX_CONNECTIONS" ]; then
        sed -i "s/^max_connections = .*/max_connections = $POSTGRES_MAX_CONNECTIONS/" "$CONF_FILE" 2>/dev/null || echo "max_connections = $POSTGRES_MAX_CONNECTIONS" >> "$CONF_FILE"
        echo "Configurado: max_connections = $POSTGRES_MAX_CONNECTIONS"
    fi

    # Asegurar que listen_addresses permita conexiones desde cualquier interfaz (necesario para Docker)
    if ! grep -q "^listen_addresses" "$CONF_FILE"; then
        echo "listen_addresses = '*'" >> "$CONF_FILE"
    fi

    # Configurar acceso remoto para conexiones externas
    HBA_FILE="$PGDATA/pg_hba.conf"
    if ! grep -q "0.0.0.0/0" "$HBA_FILE" 2>/dev/null; then
        echo "host all all 0.0.0.0/0 scram-sha-256" >> "$HBA_FILE"
        echo "Configurado: acceso remoto en pg_hba.conf"
    fi

    echo "=== Configuración de PostgreSQL completada ==="
}

# Ejecutar configuración
update_postgres_config

# No iniciamos PostgreSQL aquí - eso lo hace el entrypoint oficial
# Este script está diseñado para ser llamado desde docker-entrypoint-initdb.d/
