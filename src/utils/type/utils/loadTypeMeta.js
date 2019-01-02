import cacheTypeMeta from './cacheTypeMeta'
import getTypeLoader from './getTypeLoader'
import requireTypeMeta from './requireTypeMeta'

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
  // NOTE BRN: check for type meta in cache. If found return the original instance so that we don't create duplicate type meta information
  let typeMeta = requireTypeMeta(query, context)
  if (typeMeta) {
    return typeMeta
  }

  // const metaCache = get('types.meta', context.cache)
  // let typeMeta = get([absoluteTypePath], metaCache)
  // if (typeMeta) {
  //   return typeMeta
  // }
  const loader = getTypeLoader(query, context)
  typeMeta = await loader.loadTypeMeta(query, context)
  const typeMetaCacheKey = loader.typeMetaCacheKey(query, context)
  cacheTypeMeta(typeMetaCacheKey, typeMeta, context)
  return typeMeta
}

export default loadTypeMeta
