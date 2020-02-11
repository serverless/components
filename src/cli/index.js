/*
 * SERVERLESS COMPONENTS: CLI HANDLER
 */

const args = require('minimist')(process.argv.slice(2))
const CLI = require('./CLI')
const commands = require('./commands')

module.exports = async () => {
  const command = args._[0]
  const config = { ...args }
  if (config._) {
    delete config._
  }

  config.platformStage = process.env.SERVERLESS_PLATFORM_STAGE || 'prod'
  config.debug = process.env.SLS_DEBUG || (args.debug ? true : false)
  config.timer = commands[command] ? false : true

  // Add stage environment variable
  if (args.stage && !process.env.SERVERLESS_STAGE) {
    process.env.SERVERLESS_STAGE = args.stage
  }

  // Start CLI process
  const cli = new CLI(config)

  try {
    if (commands[command]) {
      await commands[command](config, cli)
    } else {
      await commands.run(config, cli, command)
    }
  } catch (e) {
    return cli.error(e)
  }
}
