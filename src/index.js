// eslint-disable-next-line no-underscore-dangle
if (!global._babelPolyfill) {
  // eslint-disable-next-line global-require
  require('@babel/polyfill')
}

// eslint-disable-next-line global-require
require('source-map-support/register')

const createContext = require('./createContext').default
const run = require('./run').default
const start = require('./start').default
const commands = require('./commands')

module.exports = {
  createContext,
  run,
  start,
  ...commands
}
