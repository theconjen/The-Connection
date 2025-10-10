/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.jest.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^(shared)/(.*)$': '<rootDir>/shared/$2',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  setupFilesAfterEnv: [],
  testMatch: ['**/tests/**/*.test.(ts|js)'],
  extensionsToTreatAsEsm: ['.ts']
};
