// eslint-disable-next-line no-underscore-dangle
if (!global._babelPolyfill) {
  // eslint-disable-next-line global-require
  require('@babel/polyfill')
}

// eslint-disable-next-line global-require
require('source-map-support/register')

const { createContext, walkReduceTypeChain, SYMBOL_TYPE } = require('./utils')
const run = require('./run').default
const start = require('./start').default
const commands = require('./commands')

module.exports = {
  // utils
  createContext,
  walkReduceTypeChain,
  SYMBOL_TYPE,

  // tools
  run,
  start,

  // commands
  ...commands
}
