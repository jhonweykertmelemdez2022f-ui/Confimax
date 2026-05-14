/**
 * Setup para tests E2E.
 * Carga .env.e2e ANTES de que Jest importe los test files,
 * asegurando que process.env.DATABASE_URL y demás variables
 * estén disponibles cuando shared/database.js crea el pool de PG.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.e2e') });
