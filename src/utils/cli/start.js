import dotenv from 'dotenv'
import run from '../../run'
import createContext from '../context/createContext'
import parseOptions from './parseOptions'
import parseCommand from './parseCommand'

/**
 * Starts a command fed by the command line aruments
 *
 * @param {Array<string>} argv The command line arguments
 * @param {Context} context The execution context object
 * @returns {Promise}
 */
const start = async (argv, context) => {
  // TODO BRN: Figure out somewhere else to move the env loading
  dotenv.config()

  const options = parseOptions(argv, context)

  // NOTE BRN: We regernerate the context here using the options parsed from the cli.
  context = await createContext(options, context)

  // TODO BRN: Might need to reload plugins here in order to get newly configured ones

  // NOTE BRN: We parse the command after the options since the options configure the plugins that could be responsible for parsing the command
  const command = parseCommand(argv, context)

  return run(command, context)
}

export default start
