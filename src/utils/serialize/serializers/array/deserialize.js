import { get } from '@serverless/utils'
import deserializeArray from '../../utils/deserializeArray'

const deserialize = async (serialized, context) => {
  if (get('type', serialized) !== 'array') {
    throw new TypeError(
      `array.deserialize expected a serialized array object. Instead was given ${serialized}`
    )
  }
  return deserializeArray(context, serialized)
}

export default deserialize
