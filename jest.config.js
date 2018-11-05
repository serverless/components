module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['registry/**/src/**/*.js', 'src/**/*.js'],
  coverageDirectory: './coverage/',
  setupFiles: ['<rootDir>/.jest.init.js'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/registry-old/'],
  moduleNameMapper: {
    ['^.*/registry/(.*)/dist/index.js$']: '<rootDir>/registry/$1/src/index.js'
  }
}
