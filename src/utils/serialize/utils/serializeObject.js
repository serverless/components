import { curry, isSymbol, reduce, resolve, set } from '@serverless/utils'
import getSymbolString from './getSymbolString'
import isSerializable from './isSerializable'
import isSerializableReferenceable from './isSerializableReferenceable'
import serializeValue from './serializeValue'
import toReference from './toReference'

const serializeObject = curry((context, object) =>
  reduce(
    (accum, value, key) => {
      value = resolve(value)
      if (isSerializable(value)) {
        if (isSymbol(key)) {
          const symbolString = getSymbolString(context, key)
          if (symbolString) {
            if (isSerializableReferenceable(value)) {
              return set(['symbols', symbolString], toReference(context, value), accum)
            }
            return set(['symbols', symbolString], serializeValue(context, value), accum)
          }
          // context.log(`unhandled symbol detected ${toString(key)}`)
        } else if (isSerializableReferenceable(value)) {
          return set(['props', key], toReference(context, value), accum)
        }
        return set(['props', key], serializeValue(context, value), accum)
      }
      return accum
    },
    {
      props: {},
      symbols: {}
    },
    object
  )
)

export default serializeObject
