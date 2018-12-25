import { findPath, prop } from '@serverless/utils'
import { resolve } from 'path'
import { DEFAULT_LOADERS, NATIVE_TYPES, SYMBOL_VARIABLE } from '../constants'
// import getStateStore from '../state/getStateStore'
import newContext from './newContext'

/**
 * @param {{
 *   cwd: ?string,
 *   projectPath: ?string,
 *
 * }} options
 * @returns Context
 */
const createContext = async (options = {}, context = {}) => {
  const cwd = resolve(findPath(prop('cwd', options), process.cwd()))
  // const state = getStateStore(propOr('local', 'stateStore', options))
  const state = {}
  const { loaders, overrides, types } = options

  return newContext({
    cache: {
      types: {
        defs: {},
        meta: {}
      }
    },
    ...context,
    cwd,
    loaders: loaders || DEFAULT_LOADERS,
    options,
    overrides,
    symbolMap: {
      // [SYMBOL_KEY]: '@@key',
      [SYMBOL_VARIABLE]: '@@variable'
    },
    state,
    types: types || NATIVE_TYPES
  })
}

export default createContext
