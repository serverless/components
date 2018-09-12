import { getProp } from '@serverless/utils'
import { resolve } from 'path'
import errorUnknownTypeName from './errorUnknownTypeName'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'

// TODO BRN: Replace this with something more configurable
const NATIVE_NAMES = {
  Component: resolve(__dirname, '..', '..', 'types', 'Component'),
  Function: resolve(__dirname, '..', '..', 'types', 'Function'),
  Object: resolve(__dirname, '..', '..', 'types', 'Object'),
  Plugin: resolve(__dirname, '..', '..', 'types', 'Plugin'),
  Provider: resolve(__dirname, '..', '..', 'types', 'Provider'),
  Service: resolve(__dirname, '..', '..', 'types', 'Service')
}

/**
 * @param {string} typeName the name to use to load a type
 * @param {*} context
 * @returns {{
 *   root: string,
 *   type: string
 * }}
 */
const loadTypeMetaFromName = async (typeName, context) => {
  const absoluteTypePath = getProp(typeName, NATIVE_NAMES)
  if (!absoluteTypePath) {
    throw errorUnknownTypeName(typeName)
  }
  return loadTypeMetaFromPath(absoluteTypePath, context)
}

export default loadTypeMetaFromName
