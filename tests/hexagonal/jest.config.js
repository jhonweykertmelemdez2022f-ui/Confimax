/**
 * Configuración de Jest para Tests de Arquitectura Hexagonal
 * 
 * Configurado para ejecutarse en Docker con:
 *   - PostgreSQL: Supabase (cloud) o contenedor local
 *   - Redis: Upstash (cloud) o contenedor local
 *   - MongoDB: MongoDB Atlas (cloud) o contenedor local
 *   - Tailscale: Para acceso seguro a servicios remotos (opcional)
 */

module.exports = {
  // Directorio raíz del proyecto (detectado automáticamente)
  rootDir: process.cwd() || __dirname + '/../..',
  
  // Entorno de pruebas
  testEnvironment: 'node',
  
  // Directorios donde buscar tests
  roots: ['<rootDir>/tests/hexagonal'],
  
  // Patrones de archivos de test
  testMatch: [
    '**/*.test.js'
  ],
  
  // Configuración de cobertura
  collectCoverageFrom: [
    'services/*/src/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  coverageDirectory: 'coverage/hexagonal',
  
  // Reporteros
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'junit-hexagonal.xml',
      }
    ]
  ],
  
  // Tiempo máximo de espera para tests (30 segundos para tests de integración con cloud)
  testTimeout: 30000,
  
  // Configuración para tests de integración
  setupFilesAfterEnv: ['<rootDir>/tests/hexagonal/setup.js'],
  
  // Mapeo de módulos para imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/services/$1'
  },
  
  // Variables de entorno para tests (se sobrescriben con las del contenedor)
  // NOTA: Estas variables se usan solo si no están definidas en el entorno
  // En Docker, las variables se pasan desde docker-compose.yml
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      // PostgreSQL - Por defecto usa Supabase (cloud) con DATABASE_URL
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres?sslmode=require',
      // Redis - Por defecto usa Upstash (cloud)
      REDIS_URL: process.env.REDIS_URL || 'rediss://default:gQAAAAAAAdIgAAIgcDFhNDRkNmE3OTg5YjA0MDBlODE4MzQxMGY5NGVjNmU0Mg@good-iguana-119328.upstash.io:6379',
      // MongoDB - Por defecto usa MongoDB Atlas (cloud)
      MONGO_URL: process.env.MONGO_URL || 'mongodb://jak:jema2019@ac-s1gj562-shard-00-00.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-01.tedq2nv.mongodb.net:27017,ac-s1gj562-shard-00-02.tedq2nv.mongodb.net:27017/confimax_notifications?ssl=true&replicaSet=atlas-mrqwtn-shard-0&authSource=admin&appName=Confimax',
      MONGO_DB: process.env.MONGO_DB || 'confimax_notifications',
      // Servicios
      AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      INVENTORY_SERVICE_URL: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002',
      SALES_SERVICE_URL: process.env.SALES_SERVICE_URL || 'http://sales-service:3003',
      CUSTOMERS_SERVICE_URL: process.env.CUSTOMERS_SERVICE_URL || 'http://customers-service:3004',
      NOTIFICATIONS_SERVICE_URL: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3005',
      BACKEND_URL: process.env.BACKEND_URL || 'http://backend:3006',
    }
  },
  
  // Verbose para ver detalles
  verbose: true,
  
  // Mostrar stack traces completos
  testFailureExitCode: 1
};
