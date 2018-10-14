import { isUrl } from '@serverless/utils'
import errorBadTypeQuery from './errorBadTypeQuery'
import isTypeName from './isTypeName'
import isTypeRegistryQuery from './isTypeRegistryQuery'
import loadTypeMetaFromName from './loadTypeMetaFromName'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'
import loadTypeMetaFromRegistry from './loadTypeMetaFromRegistry'
import loadTypeMetaFromUrl from './loadTypeMetaFromUrl'

/**
 * @param {string} query
 * @param {*} context
 * @returns {{
 *   props: string,
 *   query: string,
 *   root: string
 * }}
 */
const loadTypeMeta = async (query, context) => {
  if (isUrl(query)) {
    return loadTypeMetaFromUrl(query, context)
  } else if (isTypeRegistryQuery(query)) {
    return loadTypeMetaFromRegistry(query, context)
  } else if (isTypeName(query)) {
    return loadTypeMetaFromName(query, context)
  } else {
    return loadTypeMetaFromPath(query, context)
  }
  throw errorBadTypeQuery(query)
}

export default loadTypeMeta
