import { findPath, prop } from '@serverless/utils'
import { resolve } from 'path'
import { SYMBOL_KEY, SYMBOL_VARIABLE } from '../constants'
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
  const { overrides } = options

  return newContext({
    cache: {
      types: {
        defs: {},
        meta: {}
      }
    },
    ...context,
    cwd,
    options,
    overrides,
    symbolMap: {
      [SYMBOL_KEY]: '@@key',
      [SYMBOL_VARIABLE]: '@@variable'
    },
    state
  })
}

export default createContext
