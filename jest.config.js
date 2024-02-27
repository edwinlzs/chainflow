/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  coverageThreshold: {
    global: { lines: 97 },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  verbose: true,
  collectCoverage: true,
  coverageReporters: [
    "text",
    "text-summary",
    "html"
  ]
};