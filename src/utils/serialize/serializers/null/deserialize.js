import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'null') {
    throw new TypeError(
      `null.deserialize expected a serialized null. Instead was given ${serialized}`
    )
  }
  return null
}

export default deserialize
