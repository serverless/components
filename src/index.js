const { runningComponents } = require('./legacy')
const ServerlessCLI = require('./cli')
const cli = ServerlessCLI // Backwards compat

module.exports = {
  ServerlessCLI,
  cli,
  runningComponents,
}