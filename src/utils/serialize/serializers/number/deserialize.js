import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'number') {
    throw new TypeError(
      `number.deserialize expected a serialized number. Instead was given ${serialized}`
    )
  }
  return serialized.data
}

export default deserialize
