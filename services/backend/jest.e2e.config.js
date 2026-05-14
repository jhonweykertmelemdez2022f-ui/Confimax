/**
 * Jest config para tests E2E (conexiones reales).
 * NO usa setup.js (que mockea Redis/Cache).
 *
 * Uso: npx jest --config jest.e2e.config.js tests/e2e/
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.e2e.test.js'],
  testTimeout: 60000,
  setupFiles: ['<rootDir>/tests/e2e/setup.e2e.js'],
  setupFilesAfterEnv: [],
  forceExit: true,
  detectOpenHandles: false,
};
