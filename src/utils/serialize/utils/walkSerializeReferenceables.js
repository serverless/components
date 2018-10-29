import { curry } from '@serverless/utils'
import serializeReferenceable from './serializeReferenceable'
import walkReduceSerializableReferenceables from './walkReduceSerializableReferenceables'

const walkSerializeReferenceables = curry((context, value) =>
  walkReduceSerializableReferenceables(serializeReferenceable(context), {}, value, context)
)

export default walkSerializeReferenceables
