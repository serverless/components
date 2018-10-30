import { curry } from '@serverless/utils'
import getSerializer from './getSerializer'
import getType from './getType'

const serializeValue = curry((context, value) => {
  let result
  const type = getType(value)
  if (type) {
    const serializer = getSerializer(type)
    result = serializer.serialize(value, context)
  } else {
    context.log(`could not find a serializer for value ${value}`)
  }
  return result
})

export default serializeValue
