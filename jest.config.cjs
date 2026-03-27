module.exports = {
  transform: {},
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'cjs'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};