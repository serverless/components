import { clone, isNil, isEmpty } from '@serverless/utils'
import { version } from '../package.json'
import { errorReporter, findPluginForCommand } from './utils'

/**
 * Runs a command against the given context
 *
 * @param {string} command
 * @param {Context} context
 * @returns {Promise}
 */
const run = async (command, context) => {
  if (!command) {
    if (context.options.version) {
      context.log(`v${version}`)
    } else {
      context.log('TODO: output help')
    }
    return context
  }
  const reporter = await errorReporter()
  const plugin = findPluginForCommand(command, context)
  if (!plugin) {
    throw new Error(`No plugin found that handles the command '${command}'`)
  }
  try {
    return plugin.run(context)
  } catch (error) {
    if (reporter) {
      // TODO BRN: Only report unexpected exceptions
      reporter.captureException(error)
    }
    throw error
  }
}

export default run
