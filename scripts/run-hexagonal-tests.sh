#!/bin/bash
# Script para ejecutar tests de Arquitectura Hexagonal
# Uso: ./scripts/run-hexagonal-tests.sh [opciones]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Tests de Arquitectura Hexagonal - Confimax"
echo "=============================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: No se encontró docker-compose.yml${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Función para verificar si los servicios están corriendo
check_services() {
    echo "🔍 Verificando servicios..."
    
    # Verificar PostgreSQL
    if docker ps | grep -q "confimax-postgres"; then
        echo -e "${GREEN}✅ PostgreSQL corriendo${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL no está corriendo. Iniciando...${NC}"
        docker-compose up -d postgres
        sleep 5
    fi
    
    # Verificar Redis
    if docker ps | grep -q "confimax-redis"; then
        echo -e "${GREEN}✅ Redis corriendo${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis no está corriendo. Iniciando...${NC}"
        docker-compose up -d redis
        sleep 2
    fi
    
    # Verificar MongoDB
    if docker ps | grep -q "confimax-mongo"; then
        echo -e "${GREEN}✅ MongoDB corriendo${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB no está corriendo. Iniciando...${NC}"
        docker-compose up -d mongo
        sleep 3
    fi
    
    echo ""
}

# Función para ejecutar tests por capa
run_tests() {
    local layer=$1
    echo "🧪 Ejecutando tests de capa: $layer"
    echo "-----------------------------------"
    
    case $layer in
        "domain")
            npx jest tests/hexagonal/domain/ --config tests/hexagonal/jest.config.js --verbose
            ;;
        "application")
            npx jest tests/hexagonal/application/ --config tests/hexagonal/jest.config.js --verbose
            ;;
        "infrastructure")
            npx jest tests/hexagonal/infrastructure/ --config tests/hexagonal/jest.config.js --verbose
            ;;
        "integration")
            npx jest tests/hexagonal/integration/ --config tests/hexagonal/jest.config.js --verbose --runInBand
            ;;
        "all"|"")
            npx jest tests/hexagonal/ --config tests/hexagonal/jest.config.js --verbose
            ;;
        *)
            echo -e "${RED}❌ Capa no válida: $layer${NC}"
            echo "Opciones válidas: domain, application, infrastructure, integration, all"
            exit 1
            ;;
    esac
}

# Función para ejecutar tests con cobertura
run_coverage() {
    echo "📊 Ejecutando tests con cobertura..."
    npx jest tests/hexagonal/ --config tests/hexagonal/jest.config.js --coverage
    
    echo ""
    echo -e "${GREEN}✅ Reporte de cobertura generado en: coverage/hexagonal/lcov-report/index.html${NC}"
    echo "   Abre el archivo en tu navegador para ver el reporte detallado"
}

# Parsear argumentos
MODE=${1:-"all"}

# Verificar servicios si se necesitan
if [ "$MODE" = "infrastructure" ] || [ "$MODE" = "integration" ] || [ "$MODE" = "all" ]; then
    check_services
fi

# Ejecutar según modo
case $MODE in
    "domain"|"application"|"infrastructure"|"integration"|"all")
        run_tests $MODE
        ;;
    "coverage")
        run_coverage
        ;;
    "help"|"-h"|"--help")
        echo "Uso: ./scripts/run-hexagonal-tests.sh [opción]"
        echo ""
        echo "Opciones:"
        echo "  domain          - Tests de dominio (sin dependencias externas)"
        echo "  application     - Tests de casos de uso (con mocks)"
        echo "  infrastructure  - Tests de adaptadores PostgreSQL (requiere BD)"
        echo "  integration     - Tests de integración completa (requiere todos los servicios)"
        echo "  all             - Todos los tests (default)"
        echo "  coverage        - Todos los tests con reporte de cobertura"
        echo "  help            - Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  ./scripts/run-hexagonal-tests.sh domain"
        echo "  ./scripts/run-hexagonal-tests.sh integration"
        echo "  ./scripts/run-hexagonal-tests.sh coverage"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opción no válida: $MODE${NC}"
        echo "Usa 'help' para ver opciones disponibles"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Tests completados${NC}"
