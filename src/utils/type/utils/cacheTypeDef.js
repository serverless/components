import { get, isPromise, set } from '@serverless/utils'

const setTypeDefCache = (typeMeta, typeDef, context) => {
  const defsCache = get('types.defs', context.cache)
  context.cache.types.defs = set([typeMeta.root], typeDef, defsCache)
}

const cacheTypeDef = (typeMeta, typeDef, context) => {
  setTypeDefCache(typeMeta, typeDef, context)
  if (isPromise(typeDef)) {
    // NOTE BRN: Update the cache here after the promise has resolved so that when we call require we end up with fully resolved typeDefs
    typeDef.then((resolvedTypeDef) => setTypeDefCache(typeMeta, resolvedTypeDef, context))
  }
}

export default cacheTypeDef
