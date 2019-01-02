import { get, set } from '@serverless/utils'

const cacheTypeMeta = (cacheKey, typeMeta, context) => {
  const metaCache = get('types.meta', context.cache)
  context.cache.types.meta = set([cacheKey], typeMeta, metaCache)
}

export default cacheTypeMeta
