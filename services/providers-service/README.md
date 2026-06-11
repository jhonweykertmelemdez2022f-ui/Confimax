# Providers Service

Run and test the providers service locally.

Prerequisites: PostgreSQL connection configured via the shared module (see `services/shared/database.js`).

Run locally:

```bash
cd services/providers-service
npm install
npm run dev
```

Apply DB migration (example using psql):

```bash
psql "${DATABASE_URL}" -f migrations/001_create_suppliers_purchases.sql
```

Health check:

```bash
curl http://localhost:3010/health
```

Quick API examples:

List suppliers:
```bash
curl http://localhost:3010/suppliers
```

Create supplier (requires auth token in Authorization header):
```bash
curl -X POST http://localhost:3010/suppliers -H "Content-Type: application/json" -d '{"company_name":"ACME SA","contact_name":"Pedro","phone":"+58..."}'
```
