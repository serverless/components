import createContext from '../createContext'
import run from '../run'

const remove = async (options) => {
  const context = await createContext(options)
  return run('remove', context)
}

export default remove
