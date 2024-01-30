/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  coverageThreshold: {
    global: { lines: 97 },
  },
  coverageReporters: ['text', 'text-summary'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  verbose: true,
};