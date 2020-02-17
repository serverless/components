/*
 * Serverless Components: CLI Handler
 */

const args = require('minimist')(process.argv.slice(2))
const CLI = require('./CLI')
const commands = require('./commands')

module.exports = async () => {
  const command = args._[0]
  const params = []
  if (args._[1]) {
    params.push(args._[1])
  }
  if (args._[2]) {
    params.push(args._[2])
  }
  if (args._[3]) {
    params.push(args._[3])
  }
  if (args._[4]) {
    params.push(args._[4])
  }

  const config = { ...args, params }
  if (config._) {
    delete config._
  }

  config.platformStage = process.env.SERVERLESS_PLATFORM_STAGE || 'prod'
  config.debug = process.env.SLS_DEBUG || (args.debug ? true : false)

  // Add stage environment variable
  if (args.stage && !process.env.SERVERLESS_STAGE) {
    process.env.SERVERLESS_STAGE = args.stage
  }
  // Start CLI process
  const cli = new CLI(config)

  try {
    if (commands[command]) {
      await commands[command](config, cli)
    } else if (command === 'deploy' || command === 'remove') {
      await commands.run(config, cli, command)
    } else {
      cli.close('error', `Command "${command}" is not a valid command`)
    }
  } catch (e) {
    return cli.error(e)
  }
}
