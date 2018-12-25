import { get } from '@serverless/utils'

const requireTypeDef = (typeMeta, context) => {
  const defsCache = get('types.defs', context.cache)
  return get([typeMeta.root], defsCache)
}

export default requireTypeDef
