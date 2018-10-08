import createContext from '../createContext'
import run from '../run'

const info = async (options) => {
  const context = await createContext(options)
  return run('info', context)
}

export default info
