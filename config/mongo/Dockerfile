# Imagen personalizada MongoDB + Mongo Express para Confimax
# Empaqueta MongoDB y su interfaz web en un solo contenedor
# VOLUMEN: /data/db (datos persistentes)

FROM mongo:7

# Instalar Node.js y npm para Mongo Express
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g mongo-express@1.0.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Crear directorios de datos con permisos correctos para usuario mongodb (UID 999)
RUN mkdir -p /data/db /var/log/mongodb && \
    chown -R 999:999 /data/db /var/log/mongodb && \
    chmod 755 /data/db

# Copiar configuración personalizada
COPY --chown=999:999 config/mongo/mongod.conf /etc/mongod.conf

# Script de entrada para iniciar MongoDB + Mongo Express
COPY config/mongo/docker-entrypoint.sh /usr/local/bin/mongo-wrapper.sh
RUN chmod +x /usr/local/bin/mongo-wrapper.sh

# Puertos
EXPOSE 27017 8081

# Usar wrapper como entrypoint
ENTRYPOINT ["/usr/local/bin/mongo-wrapper.sh"]
