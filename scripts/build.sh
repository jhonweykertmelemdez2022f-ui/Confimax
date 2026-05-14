#!/bin/bash

echo "Building Confimax microservices..."

echo "Building auth-service..."
docker build -t confimax/auth-service ./services/auth-service

echo "Building inventory-service..."
docker build -t confimax/inventory-service ./services/inventory-service

echo "Building sales-service..."
docker build -t confimax/sales-service ./services/sales-service

echo "Building customers-service..."
docker build -t confimax/customers-service ./services/customers-service

echo "Building notifications-service..."
docker build -t confimax/notifications-service ./services/notifications-service

echo "All services built successfully!"
