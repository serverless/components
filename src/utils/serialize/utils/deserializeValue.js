import { curry } from '@serverless/utils'
import getSerializer from './getSerializer'

const deserializeValue = curry(async (context, serializedValue) => {
  const { type } = serializedValue
  if (!type) {
    throw new Error(`serialized value did not have a type ${serializedValue}`)
  }
  const serializer = getSerializer(type)
  if (!serializer) {
    throw new Error(`could not find a serializer for type ${type.name}`)
  }
  return serializer.deserialize(serializedValue, context)
})

export default deserializeValue
