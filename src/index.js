// eslint-disable-next-line no-underscore-dangle
if (!global._babelPolyfill) {
  // eslint-disable-next-line global-require
  require('babel-polyfill')
}

const run = require('./run')
const commands = require('./commands')

module.exports = {
  run,
  ...commands
}
