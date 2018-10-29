import { curry, reduce, set } from '@serverless/utils'
import deserializeValue from './deserializeValue'
import isReference from './isReference'

const deserializeArray = curry(async (context, serialized) => {
  const { indexes } = serialized
  return reduce(
    async (accum, value, index) => {
      if (!isReference(value)) {
        value = await deserializeValue(context, value)
      }
      return set(index, value, accum)
    },
    [],
    indexes
  )
})

export default deserializeArray
