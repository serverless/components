import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'infinity') {
    throw new TypeError(
      `infinity.deserialize expected a serialized Infinity. Instead was given ${serialized}`
    )
  }
  if (serialized.negative) {
    return -Infinity
  }
  return Infinity
}

export default deserialize
