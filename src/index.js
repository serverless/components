const run = require('./run')
const commands = require('./commands')

module.exports = {
  run,
  ...commands
}
