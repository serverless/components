import { deserializeTypeError } from '../../errors'

const deserialize = async (serialized) => {
  if (serialized == null || serialized.type !== 'undefined') {
    throw deserializeTypeError({
      method: 'undefined/deserialize()',
      expected: 'serialized undefined',
      value: serialized
    })
  }
  return undefined
}

export default deserialize
