# Imagen personalizada Redis + Redis Commander para Confimax
# Empaqueta Redis y su interfaz web en un solo contenedor
# VOLUMEN: /data (datos persistentes)

FROM redis:7-alpine

# Instalar Node.js y npm para Redis Commander
RUN apk add --no-cache nodejs npm && \
    npm install -g redis-commander

# Crear directorios de datos con permisos correctos para usuario redis (UID 999)
RUN mkdir -p /etc/redis /data && \
    chown -R 999:999 /data && \
    chmod 755 /data

# Copiar configuración personalizada
COPY --chown=999:999 config/redis/redis.conf /etc/redis/redis.conf

# Script de entrada para iniciar Redis + Redis Commander
COPY config/redis/docker-entrypoint.sh /usr/local/bin/redis-wrapper.sh
RUN chmod +x /usr/local/bin/redis-wrapper.sh

# Puertos
EXPOSE 6379 8081

# Usar wrapper como entrypoint
ENTRYPOINT ["/usr/local/bin/redis-wrapper.sh"]
