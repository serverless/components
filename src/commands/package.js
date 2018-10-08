import createContext from '../createContext'
import run from '../run'

const pkg = async (options) => {
  const context = await createContext(options)
  return run('package', context)
}

export default pkg
