import createContext from '../createContext'
import run from '../run'

const deploy = async (options) => {
  let context = await createContext(options)
  context = await context.loadPlugins()
  return run('deploy', context)
}

export default deploy
