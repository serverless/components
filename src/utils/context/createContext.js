import { findPath, prop } from '@serverless/utils'
import { resolve } from 'path'
import newContext from './newContext'

const createContext = async (options) => {
  const cwd = resolve(findPath(prop('cwd', options), process.cwd()))
  const overrides = options.overrides
  return newContext({
    cache: {
      types: {
        defs: {},
        meta: {}
      }
    },
    cwd,
    overrides
  })
}

export default createContext
