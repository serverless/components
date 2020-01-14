const args = require('minimist')(process.argv.slice(2))
const Context = require('./Context')
const commands = require('./commands')

module.exports = async () => {
  const command = args._[0] || 'deploy'

  const config = {}
  config.debug = process.env.SLS_DEBUG || (args.debug ? true : false)
  config.timer = commands[command] ? false : true
  config.stage = args.stage || process.env.SERVERLESS_STAGE || null

  // Start CLI process
  const context = new Context(config)
  context.start()
  context.status('Initializing')

  try {
    if (commands[command]) {
      await commands[command](context)
    } else {
      await commands.custom(context)
    }
  } catch (e) {
    return context.error(e)
  }
}
