import { createContext } from '../utils'
import run from '../run'

const info = async (options) => {
  let context = await createContext(options)
  context = await context.loadPlugins()
  return run('info', context)
}

export default info
