import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'string') {
    throw new TypeError(
      `string.deserialize expected a serialized string. Instead was given ${serialized}`
    )
  }
  return serialized.data
}

export default deserialize
