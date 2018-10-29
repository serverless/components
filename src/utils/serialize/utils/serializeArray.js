import { curry, reduce, resolve, set } from '@serverless/utils'
import isSerializable from './isSerializable'
import isSerializableReferenceable from './isSerializableReferenceable'
import serializeValue from './serializeValue'
import toReference from './toReference'

const serializeArray = curry((context, array) =>
  reduce(
    (accum, value, index) => {
      value = resolve(value)
      if (isSerializable(value)) {
        if (isSerializableReferenceable(value)) {
          return set(['indexes', index], toReference(context, value), accum)
        }
        return set(['indexes', index], serializeValue(context, value), accum)
      }
      return accum
    },
    {
      indexes: []
    },
    array
  )
)

export default serializeArray
