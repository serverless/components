const { version } = require('../package.json')
const cli = require('./cli')
const core = require('./core')
const { runningComponents } = require('./cli/utils')

module.exports = {
  runningComponents,
  version,
  cli,
  ...core
}
