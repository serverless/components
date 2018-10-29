import { __, curry, pipe, reduce, set } from '@serverless/utils'
import deserializeValue from './deserializeValue'
import findSymbol from './findSymbol'
import isReference from './isReference'

const deserializeObject = curry(async (context, serialized) => {
  const { props, symbols } = serialized

  return pipe(
    reduce(
      async (accum, value, symbolString) => {
        const symbol = findSymbol(context, symbolString)
        if (!symbol) {
          throw new Error(
            `Could not find symbol for symbol string ${symbolString} in the symbol map when trying to deserialize this object ${serialized}. You may need to add this symbol to the symbolMap in the context`
          )
        }
        if (!isReference(value)) {
          value = await deserializeValue(context, value)
        }
        return set(symbol, value, accum)
      },
      __,
      symbols
    ),
    reduce(
      async (accum, value, key) => {
        if (!isReference(value)) {
          value = await deserializeValue(context, value)
        }
        return set(key, value, accum)
      },
      __,
      props
    )
  )({})
})

export default deserializeObject
