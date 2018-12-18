import { getProp } from '@serverless/utils'

const typeMetaCacheKey = (query, context) => getProp(query, context.types)

export default typeMetaCacheKey
