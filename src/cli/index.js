const args = require('minimist')(process.argv.slice(2))
const Context = require('./Context')
const commands = require('./commands')
const { getCredentials } = require('./utils')

module.exports = async () => {
  const config = {}
  config.method = args._[0] || 'deploy'
  config.debug = args.debug ? true : false
  config.timer = commands[config.method] ? false : true
  config.credentials = getCredentials()

  // Start CLI process
  const context = new Context(config)
  context.start()

  try {
    if (commands[config.method]) {
      await commands[config.method](context)
    } else {
      await commands.custom(context)
    }
  } catch (e) {
    return context.error(e)
  }
}
