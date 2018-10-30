import { curry, map } from '@serverless/utils'
import deserializeReferenceable from './deserializeReferenceable'

const deserializeReferenceables = curry(async (context, referenceables) =>
  map(deserializeReferenceable(context), referenceables)
)

export default deserializeReferenceables
