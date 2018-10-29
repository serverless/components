import { get } from '@serverless/utils'
import deserializeObject from '../../utils/deserializeObject'

const deserialize = async (serialized, context) => {
  if (get('type', serialized) !== 'object') {
    throw new TypeError(
      `object.deserialize expected a serialized object. Instead was given ${serialized}`
    )
  }
  return deserializeObject(context, serialized)
}

export default deserialize
