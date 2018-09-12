module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['registry/**/src/**/*.js', 'src/**/*.js'],
  coverageDirectory: './coverage/',
  setupFiles: ['<rootDir>/.jest.init.js'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
}
