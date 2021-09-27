/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['__fixtures__', '__tests__/utils/*'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 15000,
}
