import { getProp } from '@serverless/utils'
import errorUnknownTypeName from '../../errors/errorUnknownTypeName'
import loadTypeMetaFromPath from '../../utils/loadTypeMetaFromPath'

/**
 * @param {string} typeName the name to use to load a type
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMeta = async (typeName, context) => {
  const absoluteTypePath = getProp(typeName, context.types)
  if (!absoluteTypePath) {
    throw errorUnknownTypeName(typeName)
  }
  const typeMeta = await loadTypeMetaFromPath(absoluteTypePath, context)
  return {
    ...typeMeta,
    query: typeName
  }
}

export default loadTypeMeta
