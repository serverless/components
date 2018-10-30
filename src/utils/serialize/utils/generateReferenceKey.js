import { curry } from '@serverless/utils'

const generateReferenceKey = curry((context, object) => {
  if (context.referenceKeys.has(object)) {
    return context.referenceKeys.get(object)
  }
  context.refNumber = context.refNumber + 1
  const refKey = `@@ref-${context.refNumber}`
  context.referenceKeys.set(object, refKey)
  return refKey
})

export default generateReferenceKey
