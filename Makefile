.PHONY: help install build up down logs status test clean

help:
	@echo "Confimax - Comandos disponibles:"
	@echo "  make install    - Instalar dependencias npm"
	@echo "  make build      - Construir imágenes Docker"
	@echo "  make up         - Iniciar todos los servicios"
	@echo "  make down       - Detener todos los servicios"
	@echo "  make logs       - Ver logs en tiempo real"
	@echo "  make status     - Ver estado de servicios"
	@echo "  make test       - Ejecutar pruebas"
	@echo "  make clean      - Limpiar contenedores y volúmenes"
	@echo ""
	@echo "Servicios disponibles:"
	@echo "  make web-dev    - Iniciar frontend web en desarrollo"

install:
	@echo "Instalando dependencias..."
	cd services/auth-service && npm install
	cd services/inventory-service && npm install
	cd services/sales-service && npm install
	cd services/customers-service && npm install
	cd services/notifications-service && npm install
	cd web && npm install

build:
	@echo "Construyendo imágenes Docker..."
	docker-compose build

up:
	docker-compose up -d
	@echo "Esperando servicios..."
	@sleep 10
	@echo "Servicios iniciados. Verifica con: make status"

down:
	docker-compose down

logs:
	docker-compose logs -f

status:
	@echo "Estado de servicios:"
	@docker-compose ps || echo "No hay servicios iniciados"

clean:
	docker-compose down -v
	@echo "Contenedores y volúmenes eliminados"

web-dev:
	cd web && npm run dev

test:
	@echo "Ejecutando pruebas..."
	@echo "(Las pruebas aún no están configuradas)"

restart: down up
