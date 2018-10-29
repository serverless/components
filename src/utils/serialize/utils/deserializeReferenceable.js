import { curry } from '@serverless/utils'
import getSerializer from './getSerializer'

const deserializeReferenceable = curry(async (context, serialized) => {
  const { type } = serialized
  const serializer = getSerializer(type)
  if (!serializer) {
    throw new Error(`Could not find serializer for type ${type}`)
  }
  return serializer.deserialize(serialized, context)
})

export default deserializeReferenceable
