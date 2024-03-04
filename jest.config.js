/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  coverageThreshold: {
    global: { lines: 97 },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: ['_testUtils.ts'],
  verbose: true,
  collectCoverage: true,
  coverageReporters: [
    "text",
    "text-summary",
    "cobertura",
    "html"
  ]
};