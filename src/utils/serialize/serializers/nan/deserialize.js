import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'nan') {
    throw new TypeError(
      `nan.deserialize expected a serialized NaN. Instead was given ${serialized}`
    )
  }
  return NaN
}

export default deserialize
