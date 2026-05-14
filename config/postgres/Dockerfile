# Dockerfile personalizado para PostgreSQL con configuración de memoria
# Extiende la imagen oficial de PostgreSQL con configuraciones optimizadas para contenedores
# NOTA: Usamos el entrypoint oficial de PostgreSQL, solo agregamos configuración adicional

FROM postgres:15-alpine

# Instalar herramientas adicionales útiles
# Nota: En Alpine Linux, el paquete se llama postgresql-contrib (sin versión en el nombre)
RUN apk add --no-cache \
    postgresql-contrib \
    tzdata

# Crear directorios necesarios
RUN mkdir -p /etc/postgresql /var/log/postgresql /docker-entrypoint-initdb.d

# Copiar configuración personalizada base
COPY config/postgres/postgresql.conf /etc/postgresql/postgresql.conf

# Script de configuración que se ejecuta DESPUÉS de que PostgreSQL inicializa la base de datos
# Se ejecuta automáticamente por el entrypoint oficial
COPY config/postgres/docker-entrypoint.sh /docker-entrypoint-initdb.d/99-custom-config.sh
RUN chmod +x /docker-entrypoint-initdb.d/99-custom-config.sh

# Script SQL para crear tablas automáticamente al inicializar
COPY config/postgres/init-scripts/create-tables.sql /docker-entrypoint-initdb.d/98-create-tables.sql

# Wrapper script para configurar acceso remoto ANTES de iniciar PostgreSQL
COPY config/postgres/wrapper.sh /wrapper.sh
RUN chmod +x /wrapper.sh

# Puerto expuesto
EXPOSE 5432

# Usar nuestro wrapper como entrypoint
# El wrapper configura pg_hba.conf y luego ejecuta el entrypoint oficial de PostgreSQL
ENTRYPOINT ["/wrapper.sh"]
CMD ["postgres"]
