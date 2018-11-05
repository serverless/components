import { createContext } from '../utils'
import run from '../run'

const remove = async (options) => {
  let context = await createContext(options)
  context = await context.loadPlugins()
  return run('remove', context)
}

export default remove
