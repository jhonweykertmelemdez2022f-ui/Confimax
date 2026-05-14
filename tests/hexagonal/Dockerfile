# Dockerfile para Tests de Arquitectura Hexagonal
# Este contenedor ejecuta tests que verifican la arquitectura del sistema

FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema para Tailscale
RUN apk add --no-cache ca-certificates

# Crear directorios para cada servicio
RUN mkdir -p /app/services/auth-service \
    /app/services/inventory-service \
    /app/services/sales-service \
    /app/services/customers-service \
    /app/services/notifications-service \
    /app/services/backend \
    /app/services/shared \
    /app/tests/hexagonal

# Copiar package.json de cada servicio
COPY services/auth-service/package.json ./services/auth-service/
COPY services/inventory-service/package.json ./services/inventory-service/
COPY services/sales-service/package.json ./services/sales-service/
COPY services/customers-service/package.json ./services/customers-service/
COPY services/notifications-service/package.json ./services/notifications-service/
COPY services/backend/package.json ./services/backend/

# Instalar dependencias de cada servicio
WORKDIR /app/services/auth-service
RUN npm install

WORKDIR /app/services/inventory-service
RUN npm install

WORKDIR /app/services/sales-service
RUN npm install

WORKDIR /app/services/customers-service
RUN npm install

WORKDIR /app/services/notifications-service
RUN npm install

WORKDIR /app/services/backend
RUN npm install

# Volver al directorio principal
WORKDIR /app

# Instalar dependencias adicionales para tests
RUN npm install -g jest-cli

# Crear package.json raíz con dependencias de test
RUN echo '{"name":"confimax-hexagonal-tests","version":"1.0.0","dependencies":{"pg":"^8.11.3","mongoose":"^8.0.3","redis":"^4.6.12","axios":"^1.6.2","jest":"^29.7.0","jest-junit":"^16.0.0"}}' > package.json \
    && npm install

# Copiar código fuente de los servicios
COPY services/auth-service/src/ ./services/auth-service/src/
COPY services/inventory-service/src/ ./services/inventory-service/src/
COPY services/sales-service/src/ ./services/sales-service/src/
COPY services/customers-service/src/ ./services/customers-service/src/
COPY services/notifications-service/src/ ./services/notifications-service/src/
COPY services/backend/src/ ./services/backend/src/
COPY services/shared/ ./services/shared/

# Copiar tests hexagonales
COPY tests/hexagonal/ ./tests/hexagonal/

# Variables de entorno por defecto
ENV NODE_ENV=test
ENV JWT_SECRET=test_secret_key_for_testing

# Comando por defecto: ejecutar tests hexagonales
CMD ["npx", "jest", "--config", "tests/hexagonal/jest.config.js", "--verbose"]
