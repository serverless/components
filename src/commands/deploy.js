import createContext from '../createContext'
import run from '../run'

const deploy = async (options) => {
  const context = await createContext(options)
  return run('deploy', context)
}

export default deploy
