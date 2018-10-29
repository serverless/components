import { get } from '@serverless/utils'

const deserialize = async (serialized) => {
  if (get('type', serialized) !== 'date') {
    throw new TypeError(
      `date.deserialize expected a serialized date object. Instead was given ${serialized}`
    )
  }
  return Date.parse(serialized.data)
}

export default deserialize
