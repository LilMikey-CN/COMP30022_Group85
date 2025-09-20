module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 60000,
  verbose: true
};