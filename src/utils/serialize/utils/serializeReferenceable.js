import { curry, has, set } from '@serverless/utils'
import generateReferenceKey from './generateReferenceKey'
import getSerializer from './getSerializer'
import getType from './getType'

const serializeReferenceable = curry((context, referenceables, referenceable) => {
  const refKey = generateReferenceKey(context, referenceable)
  if (!has(refKey, referenceables)) {
    const type = getType(referenceable)
    if (type) {
      const serializer = getSerializer(type)
      return set(refKey, serializer.serialize(referenceable, context), referenceables)
    }
  }
  return referenceables
})

export default serializeReferenceable
