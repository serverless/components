const ServerlessComponents = require('./core')
const ServerlessCLI = require('./cli')
const ServerlessUtilities = require('./utils')
const { runningComponents } = require('./legacy')
const cli = ServerlessCLI // Backwards compat

module.exports = {
  ServerlessComponents,
  ServerlessUtilities,
  runningComponents,
  cli,
}