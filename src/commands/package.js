import createContext from '../createContext'
import run from '../run'

const pkg = async (options) => {
  let context = await createContext(options)
  context = await context.loadPlugins()
  return run('package', context)
}

export default pkg
