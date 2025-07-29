/**
 * Jest Configuration for Integration Tests
 */

module.exports = {
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/src/tests/integration/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  bail: false,
  errorOnDeprecated: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};