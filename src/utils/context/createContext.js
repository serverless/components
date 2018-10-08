import { findPath, prop, propOr } from '@serverless/utils'
import { resolve } from 'path'
import getStateStore from '../state/getStateStore'
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
  const state = getStateStore(propOr('local', 'stateStore', options))
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
    state
  })
}

export default createContext
