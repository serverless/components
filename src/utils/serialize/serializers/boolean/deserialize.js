import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'boolean') {
    throw new TypeError(
      `boolean.deserialize expected a serialized boolean. Instead was given ${serialized}`
    )
  }
  return serialized.data
}

export default deserialize
