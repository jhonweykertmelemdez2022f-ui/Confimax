# Confimax - Arquitectura Técnica Detallada

## 1. Diagrama de Arquitectura C4

### C1: Contexto del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONFIMAX                                       │
│                    Sistema de Ventas e Inventario                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   VENDEDOR   │    │ ADMINISTRADOR│    │   CLIENTE   │                    │
│  │  (App Móvil) │    │   (Web)      │    │  (Consulta) │                    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └───────────────────┼───────────────────┘                          │
│                             │                                               │
│                             ▼                                               │
│                    ┌────────────────┐                                       │
│                    │  API Gateway   │                                       │
│                    │    (Nginx)     │                                       │
│                    └───────┬────────┘                                       │
│                            │                                                │
│         ┌──────────────────┼──────────────────┐                            │
│         │                  │                  │                            │
│         ▼                  ▼                  ▼                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│  │   Backend   │    │   Backend   │    │   Backend   │                    │
│  │  Services   │    │  Services   │    │  Services   │                    │
│  └─────────────┘    └─────────────┘    └─────────────┘                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CAPA DE DATOS                                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ PostgreSQL│  │  MongoDB │  │   Redis  │  │     S3/Blob     │   │    │
│  │  │  (Core)   │  │ (Catalog)│  │ (Cache)  │  │   (Imágenes)    │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### C2: Contenedores (Microservicios)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Nginx :3000)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /api/auth/*        ──────────►  Auth Service (:3001)                     │
│  /api/inventory/*   ──────────►  Inventory Service (:3002)                │
│  /api/sales/*       ──────────►  Sales Service (:3003)                    │
│  /api/customers/*   ──────────►  Customers Service (:3004)                │
│  /api/notifications/*─────────►  Notifications Service (:3005)           │
│                                                                             │
│  Rate Limiting │ Load Balancing │ SSL/TLS │ Circuit Breaker              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        AUTH SERVICE (:3001)                                 │
├────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidades:                                                         │
│  • Registro/Login de usuarios                                              │
│  • Generación y validación de JWT                                         │
│  • Gestión de roles y permisos (RBAC)                                      │
│  • Refresh tokens con rotación                                            │
│                                                                             │
│  Dependencias: PostgreSQL (usuarios), Redis (sesiones)                    │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY SERVICE (:3002)                              │
├────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidades:                                                         │
│  • Catálogo de productos (SKU, barcode, precio)                           │
│  • Gestión de stock por almacén                                           │
│  • Clasificación: peso, vencimiento, tamaño                              │
│  • Alertas de stock bajo y productos por vencer                           │
│  • Sincronización offline para app móvil                                   │
│                                                                             │
│  Dependencias: PostgreSQL (productos), Redis (cache)                      │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        SALES SERVICE (:3003)                               │
├────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidades:                                                         │
│  • Creación y gestión de facturas                                         │
│  • Cálculo multimoneda (USD, VES, COP)                                    │
│  • Aplicación de IVA e impuestos                                           │
│  • Generación de facturas PDF                                              │
│  • Historial de ventas                                                     │
│                                                                             │
│  Dependencias: PostgreSQL (ventas), Redis (cache rates)                    │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                     CUSTOMERS SERVICE (:3004)                               │
├────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidades:                                                         │
│  • Registro y gestión de clientes (RIF, datos contacto)                   │
│  • Control de cuentas por cobrar                                          │
│  • Límites de crédito por cliente                                          │
│  • Registro de pagos y abonos                                             │
│  • Estados de cuenta                                                        │
│                                                                             │
│  Dependencias: PostgreSQL (clientes, créditos)                              │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                   NOTIFICATIONS SERVICE (:3005)                            │
├────────────────────────────────────────────────────────────────────────────┤
│  Responsabilidades:                                                         │
│  • Notificaciones push/web                                                │
│  • Alertas de stock bajo                                                   │
│  • Recordatorios de crédito próximo a vencer                              │
│  • Logs de auditoría centralizados                                        │
│  • Preferencias de notificación por usuario                               │
│                                                                             │
│  Dependencias: MongoDB (logs), Redis (pub/sub)                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### C3: Componentes (Detalle de un Servicio)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY SERVICE - COMPONENTES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │                      EXPRESS APP                                 │      │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │      │
│  │  │  Controllers │  │   Middleware │  │  Validators   │        │      │
│  │  │  (Routes)     │  │ (Auth/Rate)  │  │ (Express-Valid)│        │      │
│  │  └───────┬───────┘  └───────┬───────┘  └───────────────┘        │      │
│  │          │                  │                                  │      │
│  │          ▼                  │                                  │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                   USE CASES                            │   │      │
│  │  │  • GetProduct     • UpdateStock      • GetLowStock     │   │      │
│  │  │  • CreateProduct  • CheckExpiration  • SearchProducts │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                              │                                  │      │
│  │          ┌──────────────────┼──────────────────┐              │      │
│  │          ▼                  ▼                  ▼              │      │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │      │
│  │  │  Repository │    │   Services  │    │   Events    │       │      │
│  │  │  (Product)  │    │  (Inventory)│    │  (Pub/Sub)  │       │      │
│  │  └──────┬──────┘    └──────┬──────┘    └─────────────┘       │      │
│  │         │                  │                                 │      │
│  │         ▼                  ▼                                 │      │
│  │  ┌──────────────────────────────────────────────────────┐    │      │
│  │  │                   DATA ACCESS                         │    │      │
│  │  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │    │      │
│  │  │  │  PostgreSQL │   │    Redis    │   │  Message    │  │    │      │
│  │  │  │   (SQL)     │   │   (Cache)   │   │   Queue     │  │    │      │
│  │  │  └─────────────┘   └─────────────┘   └─────────────┘  │    │      │
│  │  └──────────────────────────────────────────────────────┘    │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Definición de Interfaces de Microservicios

### 2.1 Auth Service

```yaml
openapi: 3.0.0
info:
  title: Confimax Auth Service
  version: 1.0.0
  description: Authentication and Authorization Service

servers:
  - url: http://localhost:3001
    description: Development

paths:
  /auth/register:
    post:
      summary: Register new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, email, password]
              properties:
                username: { type: string, minLength: 3, maxLength: 30 }
                email: { type: string, format: email }
                password: { type: string, minLength: 6 }
                role: { type: string, enum: [admin, vendor, manager] }
      responses:
        201: { description: User created }
        409: { description: User already exists }

  /auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, password]
              properties:
                username: { type: string }
                password: { type: string }
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken: { type: string }
                  refreshToken: { type: string }
                  user:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      username: { type: string }
                      role: { type: string }

  /auth/refresh:
    post:
      summary: Refresh access token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken: { type: string }
      responses:
        200: { description: New access token }

  /auth/me:
    get:
      summary: Get current user
      security:
        - BearerAuth: []
      responses:
        200: { description: User data }
        401: { description: Unauthorized }
```

### 2.2 Inventory Service

```yaml
openapi: 3.0.0
info:
  title: Confimax Inventory Service
  version: 1.0.0

paths:
  /products:
    get:
      summary: List products
      parameters:
        - in: query
          name: limit
          schema: { type: integer, default: 50 }
        - in: query
          name: offset
          schema: { type: integer, default: 0 }
        - in: query
          name: category_id
          schema: { type: string, format: uuid }
        - in: query
          name: weight_class
          schema: { type: string, enum: [candy, chocolate, grains] }
        - in: query
          name: expiration_class
          schema: { type: string, enum: [cold_snack, dry_snack] }
        - in: query
          name: size_class
          schema: { type: string, enum: [pinata, toy] }
      responses:
        200: { description: Product list }

    post:
      summary: Create product
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, sku, unit_price]
              properties:
                name: { type: string }
                sku: { type: string }
                barcode: { type: string }
                category_id: { type: string, format: uuid }
                weight_class: { type: string }
                expiration_class: { type: string }
                size_class: { type: string }
                unit_price: { type: number }
                cost_price: { type: number }
                stock_quantity: { type: integer }
                min_stock_level: { type: integer, default: 10 }
                expiration_date: { type: string, format: date }
      responses:
        201: { description: Product created }
        401: { description: Unauthorized }

  /products/{id}:
    get:
      summary: Get product by ID
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        200: { description: Product data }
        404: { description: Product not found }

    put:
      summary: Update product
      security:
        - BearerAuth: []
      responses:
        200: { description: Product updated }

  /products/barcode/{barcode}:
    get:
      summary: Get product by barcode
      parameters:
        - in: path
          name: barcode
          required: true
          schema: { type: string }
      responses:
        200: { description: Product data }

  /products/search-abc:
    get:
      summary: Search products by ABC (prefix)
      parameters:
        - in: query
          name: prefix
          required: true
          schema: { type: string }
      responses:
        200: { description: Matching products }

  /products/low-stock:
    get:
      summary: Get products below minimum stock
      security:
        - BearerAuth: []
      responses:
        200: { description: Low stock products }

  /products/expiring:
    get:
      summary: Get products expiring soon
      parameters:
        - in: query
          name: days
          schema: { type: integer, default: 30 }
      responses:
        200: { description: Expiring products }

  /categories:
    get:
      summary: List categories
      responses:
        200: { description: Category list }

  /categories/tree:
    get:
      summary: Get category tree
      responses:
        200: { description: Category tree }
```

### 2.3 Sales Service

```yaml
openapi: 3.0.0
info:
  title: Confimax Sales Service
  version: 1.0.0

paths:
  /sales:
    post:
      summary: Create new sale
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [items]
              properties:
                customer_id: { type: string, format: uuid }
                items:
                  type: array
                  items:
                    type: object
                    required: [product_id, quantity, unit_price]
                    properties:
                      product_id: { type: string, format: uuid }
                      quantity: { type: integer }
                      unit_price: { type: number }
                currency:
                  type: string
                  enum: [USD, VES, COP]
                  default: VES
                notes: { type: string }
      responses:
        201: { description: Sale created }

    get:
      summary: List sales
      parameters:
        - in: query
          name: limit
          schema: { type: integer, default: 50 }
        - in: query
          name: offset
          schema: { type: integer, default: 0 }
        - in: query
          name: customer_id
          schema: { type: string, format: uuid }
        - in: query
          name: start_date
          schema: { type: string, format: date }
        - in: query
          name: end_date
          schema: { type: string, format: date }
      responses:
        200: { description: Sales list }

  /sales/{id}:
    get:
      summary: Get sale details
      responses:
        200: { description: Sale data }

  /sales/daily:
    get:
      summary: Get daily sales
      parameters:
        - in: query
          name: date
          schema: { type: string, format: date }
      responses:
        200: { description: Daily sales }

  /sales/summary:
    get:
      summary: Get sales summary
      parameters:
        - in: query
          name: start_date
          required: true
          schema: { type: string, format: date }
        - in: query
          name: end_date
          required: true
          schema: { type: string, format: date }
      responses:
        200:
          description: Sales summary
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_sales: { type: integer }
                  total_subtotal: { type: number }
                  total_iva: { type: number }
                  total_amount: { type: number }
                  average_sale: { type: number }

  /sales/convert:
    get:
      summary: Convert price between currencies
      parameters:
        - in: query
          name: amount
          required: true
          schema: { type: number }
        - in: query
          name: from
          required: true
          schema: { type: string, enum: [USD, VES, COP] }
        - in: query
          name: to
          required: true
          schema: { type: string, enum: [USD, VES, COP] }
      responses:
        200:
          description: Converted amount
          content:
            application/json:
              schema:
                type: object
                properties:
                  amount: { type: number }
                  from: { type: string }
                  to: { type: string }
```

### 2.4 Customers Service

```yaml
openapi: 3.0.0
info:
  title: Confimax Customers Service
  version: 1.0.0

paths:
  /customers:
    get:
      summary: List customers
      responses:
        200: { description: Customer list }

    post:
      summary: Create customer
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, rif]
              properties:
                name: { type: string }
                rif: { type: string }
                email: { type: string, format: email }
                phone: { type: string }
                address: { type: string }
                credit_limit: { type: number }
      responses:
        201: { description: Customer created }

  /customers/{id}:
    get:
      summary: Get customer
      responses:
        200: { description: Customer data }

  /customers/search:
    get:
      summary: Search customers
      parameters:
        - in: query
          name: q
          required: true
          schema: { type: string }
      responses:
        200: { description: Search results }

  /credits:
    get:
      summary: List credits
      security:
        - BearerAuth: []
      parameters:
        - in: query
          name: status
          schema: { type: string, enum: [active, paid, overdue] }
        - in: query
          name: overdue
          schema: { type: boolean }
      responses:
        200: { description: Credits list }

  /credits/expiring:
    get:
      summary: Get expiring credits
      parameters:
        - in: query
          name: days
          schema: { type: integer, default: 7 }
      responses:
        200: { description: Expiring credits }

  /credits/overdue:
    get:
      summary: Get overdue credits
      responses:
        200: { description: Overdue credits }

  /credits/{id}/payment:
    post:
      summary: Add payment to credit
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount]
              properties:
                amount: { type: number }
                payment_method: { type: string, enum: [cash, transfer, check, card] }
                reference: { type: string }
      responses:
        200: { description: Payment applied }
```

### 2.5 Notifications Service

```yaml
openapi: 3.0.0
info:
  title: Confimax Notifications Service
  version: 1.0.0

paths:
  /notifications:
    post:
      summary: Create notification
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [type, title, message, user_id]
              properties:
                type:
                  type: string
                  enum: [stock_low, stock_expiring, credit_expiring, credit_overdue, system]
                title: { type: string }
                message: { type: string }
                priority: { type: string, enum: [low, medium, high, critical] }
                data: { type: object }
                user_id: { type: string }
      responses:
        201: { description: Notification created }

  /notifications/user/{user_id}:
    get:
      summary: Get user notifications
      parameters:
        - in: query
          name: limit
          schema: { type: integer, default: 50 }
        - in: query
          name: unread_only
          schema: { type: boolean }
      responses:
        200: { description: Notifications list }

  /notifications/{id}/read:
    patch:
      summary: Mark notification as read
      responses:
        200: { description: Notification updated }
```

---

## 3. Esquema de Comunicación

### 3.1 Comunicación Síncrona (REST)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMUNICACIÓN REST (Puerto 3000)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENTE                                                                  │
│     │                                                                     │
│     ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        NGINX API GATEWAY                             │ │
│  │  • SSL/TLS Termination                                                │ │
│  │  • Rate Limiting (100 req/min)                                       │ │
│  │  • Load Balancing (Round Robin)                                      │ │
│  │  • Circuit Breaker                                                   │ │
│  │  • Request/Response Logging                                          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│     │                                                                     │
│     ▼                                                                     │
│  HTTP/REST                                                                │
│     │                                                                     │
│     ├──► Auth Service (3001)                                              │
│     │       POST /auth/login, POST /auth/register, POST /auth/refresh   │
│     │                                                                     │
│     ├──► Inventory Service (3002)                                         │
│     │       GET/POST/PUT /products, GET /products/low-stock              │
│     │       GET /categories, GET /products/barcode/:barcode             │
│     │                                                                     │
│     ├──► Sales Service (3003)                                             │
│     │       POST /sales, GET /sales, GET /sales/summary                  │
│     │       GET /sales/convert                                           │
│     │                                                                     │
│     ├──► Customers Service (3004)                                         │
│     │       GET/POST /customers, GET /credits, POST /credits/payment    │
│     │                                                                     │
│     └──► Notifications Service (3005)                                     │
│             POST /notifications, GET /notifications/user/:user_id        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Comunicación Asíncrona (Eventos Redis Pub/Sub)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMUNICACIÓN ASÍNCRONA (Redis)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    REDIS PUBSUB / MESSAGE QUEUE                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │ INVENTORY   │          │  CUSTOMERS  │          │NOTIFICATIONS│         │
│  │  SERVICE   │          │   SERVICE   │          │   SERVICE   │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
│                                                                             │
│  EVENTOS:                                                                   │
│  ────────                                                                   │
│  • inventory:stock.updated    → Notifica cambio de stock                    │
│  • inventory:product.expiring → Producto por vencer                        │
│  • customers:credit.created → Nuevo crédito creado                         │
│  • customers:credit.payment  → Pago recibido                               │
│  • sales:sale.completed     → Venta completada                             │
│  • notifications:new        → Nueva notificación para enviar              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Definición de gRPC (Protobuf)

```protobuf
// confimax.proto
syntax = "proto3";

package confimax;

service InventoryService {
  rpc GetProduct(GetProductRequest) returns (Product);
  rpc UpdateStock(UpdateStockRequest) returns (StockUpdateResponse);
  rpc StreamLowStock(Empty) returns (stream LowStockAlert);
}

service SalesService {
  rpc CalculateTotal(CalculateTotalRequest) returns (TotalResponse);
  rpc ConvertCurrency(ConvertRequest) returns (ConvertResponse);
}

message GetProductRequest {
  string product_id = 1;
}

message Product {
  string id = 1;
  string name = 2;
  string sku = 3;
  string barcode = 4;
  double unit_price = 5;
  int32 stock_quantity = 6;
}

message UpdateStockRequest {
  string product_id = 1;
  int32 quantity = 2;
  string operation = 3; // "add" or "subtract"
}

message StockUpdateResponse {
  bool success = 1;
  int32 new_quantity = 2;
}

message CalculateTotalRequest {
  repeated SaleItem items = 1;
  string currency = 2;
}

message SaleItem {
  string product_id = 1;
  int32 quantity = 2;
  double unit_price = 3;
}

message TotalResponse {
  double subtotal = 1;
  double iva = 2;
  double total = 3;
  string currency = 4;
}

message ConvertRequest {
  double amount = 1;
  string from = 2;
  string to = 3;
}

message ConvertResponse {
  double amount = 1;
  string from = 2;
  string to = 3;
}

message LowStockAlert {
  string product_id = 1;
  string product_name = 2;
  int32 current_stock = 3;
  int32 min_stock = 4;
}

message Empty {}
```

---

## 4. Estrategia de Persistencia Políglota

### 4.1 PostgreSQL - Esquema de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ESQUEMA POSTGRESQL (CORE DATA)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  confimax_auth                                                              │
│  ├── users (id, username, email, password, role, created_at, updated_at) │
│  ├── sessions (id, user_id, token, expires_at, created_at)                │
│  └── audit_log (id, user_id, action, ip_address, created_at)              │
│                                                                             │
│  confimax_inventory                                                         │
│  ├── categories (id, name, description, parent_id, active)                │
│  ├── products (id, name, sku, barcode, category_id, unit_price,           │
│  │            cost_price, stock_quantity, min_stock_level, ...)          │
│  └── stock_movements (id, product_id, quantity, type, reason, created_at)│
│                                                                             │
│  confimax_sales                                                             │
│  ├── sales (id, customer_id, vendor_id, subtotal, iva, total, currency)  │
│  ├── sale_items (id, sale_id, product_id, quantity, unit_price, total)   │
│  └── invoices (id, sale_id, number, pdf_url, created_at)                  │
│                                                                             │
│  confimax_customers                                                         │
│  ├── customers (id, name, rif, email, phone, address, credit_limit)      │
│  ├── credits (id, customer_id, sale_id, amount, balance, status, ...)    │
│  └── credit_payments (id, credit_id, amount, payment_method, ...)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 MongoDB - Colecciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MONGODB (CATALOG & LOGS)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  confimax_notifications                                                     │
│  ├── notifications (type, title, message, priority, data, user_id, read)   │
│  └── notification_settings (user_id, email_notifications, types_config)  │
│                                                                             │
│  confimax_audit                                                             │
│  ├── audit_logs (entity_type, entity_id, action, user_id, changes, ...)    │
│  └── api_logs (method, path, status_code, duration, user_id, ...)         │
│                                                                             │
│  confimax_catalog                                                           │
│  ├── product_catalog (flexible product attributes, tags)                  │
│  └── customer_notes (customer_id, note, author_id, created_at)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Redis - Estructura de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDIS (CACHE & QUEUE)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KEYS:                                                                     │
│  ─────                                                                     │
│  • session:{user_id}           → Session data (TTL: 24h)                  │
│  • refresh:{token}             → Refresh token mapping                     │
│  • ratelimit:{ip}              → Rate limit counter                         │
│                                                                             │
│  CACHE:                                                                      │
│  ──────                                                                     │
│  • product:{id}                → Product cached (TTL: 5min)                │
│  • products:list:{filters}    → Product list cache                         │
│  • category:{id}              → Category cache (TTL: 1h)                   │
│  • exchange_rates             → Currency rates (TTL: 1h)                  │
│                                                                             │
│  PUB/SUB CHANNELS:                                                          │
│  ─────────────────                                                          │
│  • events:inventory           → Stock updates                               │
│  • events:sales               → New sales                                  │
│  • events:credits             → Credit changes                             │
│  • events:notifications       → Push notifications                         │
│                                                                             │
│  QUEUES:                                                                    │
│  ────────                                                                    │
│  • sync:queue                 → Offline sync queue                          │
│  • notifications:queue        → Pending notifications                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Seguridad

### 5.1 Flujo de Autenticación OAuth2/JWT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OAUTH2 / JWT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LOGIN                                                                   │
│  ┌─────────┐    POST /auth/login    ┌─────────────┐                        │
│  │ CLIENTE │ ─────────────────────► │ AUTH SERVICE│                        │
│  │         │ ◄───────────────────── │             │                        │
│  └─────────┘    {accessToken,       └─────────────┘                        │
│                 refreshToken, user}                                         │
│                                                                             │
│  2. API REQUEST                                                             │
│  ┌─────────┐  Authorization: Bearer   ┌─────────────┐                        │
│  │ CLIENTE │ ─────────────────────► │   NGINX     │                        │
│  │         │ ◄───────────────────── │ (Forward)   │                        │
│  └─────────┘    {data}               └─────────────┘                        │
│                                          │                                  │
│                                          ▼                                  │
│                                  ┌─────────────┐                            │
│                                  │   SERVICE   │                            │
│                                  │ (Validate)  │                            │
│                                  └─────────────┘                            │
│                                                                             │
│  3. TOKEN REFRESH (Antes de expirar)                                        │
│  ┌─────────┐  POST /auth/refresh  ┌─────────────┐                         │
│  │ CLIENTE │ ───────────────────► │ AUTH SERVICE│                         │
│  │         │ ◄──────────────────── │             │                         │
│  └─────────┘    {newAccessToken}  └─────────────┘                         │
│                                                                             │
│  TOKEN STRUCTURE:                                                           │
│  ───────────────                                                            │
│  {                                                                          │
│    "userId": "uuid",                                                        │
│    "username": "vendor1",                                                   │
│    "role": "vendor",                                                        │
│    "iat": 1234567890,                                                       │
│    "exp": 1234577890  (24h)                                                │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Roles y Permisos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RBAC - ROLES Y PERMISOS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ROL: ADMIN                                                                │
│  ─────────────                                                             │
│  ✅ users:* (full access)                                                  │
│  ✅ products:* (full access)                                              │
│  ✅ sales:* (full access)                                                  │
│  ✅ customers:* (full access)                                              │
│  ✅ credits:* (full access)                                               │
│  ✅ notifications:* (full access)                                         │
│                                                                             │
│  ROL: MANAGER                                                              │
│  ───────────────                                                           │
│  ✅ products:read, products:write                                          │
│  ✅ sales:read, sales:write                                               │
│  ✅ customers:read, customers:write                                        │
│  ✅ credits:read, credits:write                                           │
│  ✅ notifications:read, notifications:write                               │
│                                                                             │
│  ROL: VENDOR                                                               │
│  ─────────────                                                             │
│  ✅ products:read (search, barcode lookup)                                 │
│  ✅ products:update (stock adjustment)                                     │
│  ✅ sales:write                                                            │
│  ✅ customers:read                                                         │
│  ✅ credits:read                                                           │
│  ✅ notifications:read                                                    │
│                                                                             │
│  ENDPOINT SECURITY:                                                        │
│  ──────────────────                                                        │
│  POST/PUT/DELETE  → Require admin/manager role                            │
│  GET sensitive    → Require authentication                                │
│  /health           → Public (no auth required)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Patrones de Diseño

### 6.1 Estructura de Directorios

```
confimax/
├── docker-compose.yml              # Orquestación principal
├── docker-compose.production.yml   # Override para producción
├── .env.example                    # Variables de entorno
│
├── nginx/
│   ├── nginx.conf                  # Configuración base
│   ├── ssl.conf                    # Configuración SSL
│   └── cors.conf                   # Configuración CORS
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── config/             # Configuración (DI)
│   │   │   ├── controllers/       # Controladores HTTP
│   │   │   ├── models/            # Modelos de dominio
│   │   │   ├── repositories/      # Repository pattern
│   │   │   ├── services/          # Lógica de negocio
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── routes/            # Definición de rutas
│   │   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── validators/        # Validadores
│   │   │   ├── events/            # Event handlers
│   │   │   └── index.js           # Punto de entrada
│   │   ├── tests/
│   │   ├── schema.sql             # DDL database
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── inventory-service/         # Misma estructura
│   ├── sales-service/             # Misma estructura
│   ├── customers-service/        # Misma estructura
│   └── notifications-service/    # Misma estructura
│
├── scripts/
│   ├── init-db.sh                 # Inicialización BD
│   ├── build.sh                   # Build de imágenes
│   └── deploy.sh                  # Script de despliegue
│
└── mobile/
    ├── src/
    │   ├── components/
    │   ├── screens/
    │   ├── services/              # API, sync, database
    │   ├── stores/                # Zustand stores
    │   └── navigation/
    ├── android/
    ├── ios/
    └── package.json
```

### 6.2 Patrón Repository

```javascript
// services/inventory-service/src/repositories/product.repository.js
class ProductRepository {
  constructor(pool, cacheService) {
    this.pool = pool;
    this.cache = cacheService;
  }

  async findById(id) {
    const cacheKey = `product:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.pool.query(
      'SELECT * FROM products WHERE id = $1 AND active = true',
      [id]
    );
    
    if (result.rows[0]) {
      await this.cache.set(cacheKey, result.rows[0], 300);
    }
    return result.rows[0];
  }

  async create(data) {
    const result = await this.pool.query(
      `INSERT INTO products (...) VALUES (...) RETURNING *`,
      [data.name, data.sku, /* ... */]
    );
    await this.cache.delPattern('products:list:*');
    return result.rows[0];
  }

  async update(id, data) {
    const result = await this.pool.query(
      `UPDATE products SET ... WHERE id = $1 RETURNING *`,
      [id]
    );
    await this.cache.del(`product:${id}`);
    await this.cache.delPattern('products:list:*');
    return result.rows[0];
  }
}

module.exports = ProductRepository;
```

### 6.3 Patrón Dependency Injection

```javascript
// services/inventory-service/src/config/index.js
const container = {
  config: require('./config'),
  
  // Database
  get pool() {
    if (!this._pool) {
      this._pool = new Pool(config.db);
    }
    return this._pool;
  },
  
  // Cache
  get cacheService() {
    if (!this._cacheService) {
      const RedisService = require('../services/redis.service');
      this._cacheService = new RedisService(this.config);
    }
    return this._cacheService;
  },
  
  // Repositories
  get productRepository() {
    if (!this._productRepository) {
      const ProductRepository = require('../repositories/product.repository');
      this._productRepository = new ProductRepository(
        this.pool,
        this.cacheService
      );
    }
    return this._productRepository;
  },
  
  // Services
  get inventoryService() {
    if (!this._inventoryService) {
      const InventoryService = require('../services/inventory.service');
      this._inventoryService = new InventoryService(
        this.productRepository
      );
    }
    return this._inventoryService;
  },
  
  // Controllers
  get productController() {
    const ProductController = require('../controllers/product.controller');
    return new ProductController(this.inventoryService);
  }
};

module.exports = container;
```

---

## 7. Rendimiento y Alta Disponibilidad

### 7.1 Objetivos de Rendimiento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REQUISITOS DE RENDIMIENTO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CARGA:                                                                     │
│  ──────                                                                     │
│  • 500+ peticiones concurrentes                                            │
│  • Peak: 2000 req/min durante horas pico                                    │
│  • Promedio: 500 req/min                                                    │
│                                                                             │
│  LATENCIA:                                                                  │
│  ────────                                                                   │
│  • P50: < 100ms                                                            │
│  • P95: < 500ms                                                            │
│  • P99: < 1000ms                                                           │
│                                                                             │
│  DISPONIBILIDAD:                                                            │
│  ─────────────                                                             │
│  • SLA: 99.9% (disponible 8.76 horas/año)                                  │
│  • Tiempo de recuperación: < 15 minutos                                    │
│  • rolling deployments sin downtime                                        │
│                                                                             │
│  ESCALABILIDAD:                                                             │
│  ───────────                                                                │
│  • Horizontal: 3+ réplicas por servicio                                     │
│  • Vertical: hasta 8GB RAM, 4 vCPU por contenedor                          │
│  • Auto-scaling: HPA con 70% CPU threshold                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Estrategias de Optimización

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ESTRATEGIAS DE OPTIMIZACIÓN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CACHE LAYER (Redis)                                                        │
│  ────────────────                                                           │
│  • Product cache: 5 min TTL                                                │
│  • Category cache: 1h TTL                                                  │
│  • Exchange rates: 1h TTL                                                  │
│  • Session: 24h TTL                                                         │
│  • Rate limiting: 1 min sliding window                                     │
│                                                                             │
│  DATABASE OPTIMIZATION                                                      │
│  ─────────────────────                                                      │
│  • Connection pooling: 20 conexiones máx                                   │
│  • Query optimization: EXPLAIN ANALYZE                                      │
│  • Indexes covering: id, sku, barcode, category_id, stock                 │
│  • Read replicas: para consultas pesadas                                   │
│                                                                             │
│  NETWORK OPTIMIZATION                                                       │
│  ───────────────────                                                       │
│  • Gzip compression: enabled                                              │
│  • Keep-alive: 65 segundos                                                 │
│  • HTTP/2: enabled                                                         │
│  • CDN para assets estáticos                                               │
│                                                                             │
│  CODE OPTIMIZATION                                                          │
│  ─────────────────                                                         │
│  • Async/await para I/O                                                    │
│  • Batch operations cuando sea posible                                      │
│  • Lazy loading para recursos                                             │
│  • Memoización de cálculos frecuentes                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Circuit Breaker

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CIRCUIT BREAKER PATTERN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NGINX CONFIGURATION:                                                       │
│  ───────────────────                                                       │
│                                                                             │
│  upstream backend {                                                          │
│    server inventory-service:3002 max_fails=3 fail_timeout=30s;             │
│    server inventory-service-2:3002 max_fails=3 fail_timeout=30s;          │
│    server inventory-service-3:3002 max_fails=3 fail_timeout=30s;         │
│  }                                                                          │
│                                                                             │
│  fail_timeout: Tiempo antes de intentar de nuevo                          │
│  max_fails: Intentos fallidos antes de marcar como caído                  │
│                                                                             │
│  ESTADOS:                                                                   │
│  ────────                                                                   │
│  • CLOSED: Peticiones normales                                             │
│  • OPEN: Servicio no disponible, respuestas fallback                     │
│  • HALF-OPEN: Probando recuperación                                        │
│                                                                             │
│  FALLBACK:                                                                  │
│  ────────                                                                   │
│  • Cache responses desde Redis                                             │
│  • Queue requests para reintento                                            │
│  • Health check endpoints para monitoreo                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Monitoreo y Observabilidad

### 8.1 Métricas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONITOREO (Metrics)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APPLICATION METRICS:                                                        │
│  ────────────────────                                                       │
│  • Request rate (req/s)                                                    │
│  • Response time (P50, P95, P99)                                           │
│  • Error rate (%)                                                          │
│  • Active connections                                                       │
│                                                                             │
│  BUSINESS METRICS:                                                           │
│  ────────────────                                                          │
│  • Sales per hour                                                          │
│  • New customers per day                                                   │
│  • Low stock products count                                                │
│  • Overdue credits value                                                  │
│                                                                             │
│  INFRASTRUCTURE METRICS:                                                    │
│  ───────────────────────                                                   │
│  • CPU usage (%)                                                           │
│  • Memory usage (MB)                                                       │
│  • Disk I/O                                                                │
│  • Network throughput                                                       │
│  • Container restart count                                                 │
│                                                                             │
│  PROMETHEUS EXPORTERS:                                                      │
│  ─────────────────────                                                     │
│  • Node Exporter (system)                                                  │
│  • Postgres Exporter                                                       │
│  • Redis Exporter                                                          │
│  • Nginx Exporter                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Logging

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOGGING STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FORMAT: JSON estructurado                                                 │
│  ───────                                                                    │
│  {                                                                         │
│    "timestamp": "2024-01-15T10:30:00Z",                                    │
│    "level": "INFO",                                                        │
│    "service": "inventory-service",                                        │
│    "trace_id": "abc123",                                                   │
│    "user_id": "user-456",                                                  │
│    "action": "product.update",                                            │
│    "message": "Product updated successfully",                             │
│    "metadata": {                                                           │
│      "product_id": "prod-789",                                             │
│      "changes": { "stock": { "old": 10, "new": 5 } }                      │
│    }                                                                       │
│  }                                                                         │
│                                                                             │
│  LOG LEVELS:                                                                │
│  ───────────                                                                │
│  • DEBUG: Desarrollo                                                       │
│  • INFO: Operaciones normales                                             │
│  • WARN: Advertencias (lento, reintentos)                                  │
│  • ERROR: Errores (sin crash)                                              │
│  • FATAL: Errores críticos (crash)                                         │
│                                                                             │
│  STACKTRACE: Solo en ERROR y FATAL                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Distributed Tracing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DISTRIBUTED TRACING                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRACE FLOW:                                                                │
│  ───────────                                                                │
│                                                                             │
│  ┌────────┐    GET /api/sales    ┌──────────────┐                         │
│  │ CLIENT │ ──────────────────► │   NGINX      │ (trace_id: abc123)     │
│  └────────┘                     └──────┬───────┘                         │
│                                       │                                    │
│                                       ▼                                    │
│  ┌────────┐    POST /sales      ┌──────────────┐                         │
│  │ NGINX  │ ──────────────────► │ SALES SVC    │ (span: sales.create)   │
│  └────────┘                     └──────┬───────┘                         │
│                                       │                                    │
│                  ┌────────────────────┼────────────────────┐              │
│                  │                    │                    │              │
│                  ▼                    ▼                    ▼              │
│          ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│          │  INVENTORY   │    │  CUSTOMERS   │    │ NOTIFICATIONS│        │
│          │  (check)    │    │  (credit)   │    │   (create)   │        │
│          └──────────────┘    └──────────────┘    └──────────────┘        │
│                                                                             │
│  JAEGER/ZIPKIN: Collectores distribuidos                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Bibliografía y Estándares

- **C4 Model**: https://c4model.com/
- **12-Factor App**: https://12factor.net/
- **Microservices Patterns**: https://microservices.io/
- **OpenAPI Specification**: https://swagger.io/specification/
- **gRPC**: https://grpc.io/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Redis Documentation**: https://redis.io/documentation
- **JWT RFC 7519**: https://tools.ietf.org/html/rfc7519
- **OAuth 2.0 RFC 6749**: https://tools.ietf.org/html/rfc6749
