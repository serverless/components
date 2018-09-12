import { isUrl } from '@serverless/utils'
import { memoizeWith } from 'ramda'
import errorBadTypeQuery from './errorBadTypeQuery'
import isGitUrl from './isGitUrl'
import isTypeName from './isTypeName'
import isTypeRegistryQuery from './isTypeRegistryQuery'
import loadTypeMetaFromGitUrl from './loadTypeMetaFromGitUrl'
import loadTypeMetaFromName from './loadTypeMetaFromName'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'
import loadTypeMetaFromRegistry from './loadTypeMetaFromRegistry'
import loadTypeMetaFromUrl from './loadTypeMetaFromUrl'

/**
 * @param {string} query
 * @param {*} context
 * @returns {{
 *   root: string,
 *   type: string
 * }}
 */
const loadTypeMeta = async (query, context) => {
  if (isGitUrl(query)) {
    return loadTypeMetaFromGitUrl(query, context)
  } else if (isUrl(query)) {
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
