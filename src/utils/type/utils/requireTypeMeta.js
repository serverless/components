import { get } from '@serverless/utils'
import getTypeLoader from './getTypeLoader'

const requireTypeMeta = (query, context) => {
  const loader = getTypeLoader(query, context)
  const cacheKey = loader.typeMetaCacheKey(query, context)
  const metaCache = get('types.meta', context.cache)
  return get([cacheKey], metaCache)
}

export default requireTypeMeta
