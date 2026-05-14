#!/bin/bash

echo "========================================="
echo "  CONFIMAX - Sistema de Prueba"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para verificar estado
check_service() {
    local name=$1
    local url=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200\|401"; then
        echo -e "${GREEN}[OK]${NC} $name"
        return 0
    else
        echo -e "${RED}[FALLO]${NC} $name"
        return 1
    fi
}

# Verificar Docker
echo -e "${YELLOW}Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker no está instalado${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}Docker disponible${NC}"
echo ""

# Instalar dependencias npm para cada servicio
echo -e "${YELLOW}Instalando dependencias npm...${NC}"
for service in services/*/; do
    if [ -f "$service/package.json" ]; then
        echo "  Instalando $(basename $service)..."
        cd "$service" && npm install --silent 2>/dev/null
    fi
done

echo ""
echo -e "${YELLOW}Iniciando contenedores Docker...${NC}"
cd "$(dirname "$0")"

# Iniciar servicios
docker-compose up -d --build

echo ""
echo -e "${YELLOW}Esperando que los servicios estén disponibles...${NC}"
echo "(Esto puede tomar 1-2 minutos)"
echo ""

# Esperar y verificar servicios
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt+1))
    echo -n "."
    sleep 3
    
    # Verificar si los servicios están corriendo
    if docker-compose ps | grep -q "Up"; then
        break
    fi
done

echo ""
echo ""

# Verificar servicios uno por uno
echo -e "${YELLOW}Verificando servicios...${NC}"
check_service "Nginx API Gateway" "http://localhost:3000/health"
check_service "Auth Service" "http://localhost:3001/health"
check_service "Inventory Service" "http://localhost:3002/health"
check_service "Sales Service" "http://localhost:3003/health"
check_service "Customers Service" "http://localhost:3004/health"
check_service "Notifications Service" "http://localhost:3005/health"

echo ""
echo -e "${YELLOW}Verificando bases de datos...${NC}"
check_service "PostgreSQL" "http://localhost:5432" || echo "  PostgreSQL (verificar con cliente)"
check_service "MongoDB" "http://localhost:27017" || echo "  MongoDB (verificar con cliente)"

echo ""
echo "========================================="
echo "  RESUMEN"
echo "========================================="
echo ""
echo "Puertos disponibles:"
echo "  - Frontend Web:  http://localhost:5173"
echo "  - API Gateway:   http://localhost:3000"
echo "  - Auth Service:  http://localhost:3001"
echo "  - Inventory:     http://localhost:3002"
echo "  - Sales:         http://localhost:3003"
echo "  - Customers:     http://localhost:3004"
echo "  - Notifications: http://localhost:3005"
echo "  - PostgreSQL:    localhost:5432"
echo "  - MongoDB:      localhost:27017"
echo "  - Redis:        localhost:6379"
echo ""

# Verificar si hay errores en los logs
echo -e "${YELLOW}Últimos logs de servicios:${NC}"
docker-compose logs --tail=5 2>/dev/null || echo "No hay logs disponibles"

echo ""
echo "Para ver logs en tiempo real: docker-compose logs -f"
echo "Para detener: docker-compose down"
