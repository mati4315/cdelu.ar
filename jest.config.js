module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/features/**/__tests__/**/*.spec.js'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};


