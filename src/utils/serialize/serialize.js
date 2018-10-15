import { isArray, isObject, isPlainObject } from '@serverless/utils'

const getType = (value) => {
  if (isFunction(value.getType)) {
    return value.getType()
  }
}

// NOTE BRN: This method belongs here and not in utils because the core has to have an understanding of how it serialized things and has to deal with backward compatability of older versions of serialized data. Will need a way of determining which serialization version was used. Later, this would probably be something that belongs in an SDK.

const serialize = (value) => {
  const refNumber = 0
  const references = new WeakMap()
  const generateRefKey = (object) => {
    if (references.has(object)) {
      return references.get(object)
    }
    refNumber = refNumber + 1
    const refKey = `@@ref-${refNumber}`
    references.set(object, refKey)
    return refKey
  }
  const entry = generateRefKey(value)
  const instances = {}
  const refKey = generateRefKey(value)
  const instance = instances[refKey]
  if (!instance) {
    const type = getType(instance)
    if (type) {
    }
    instance = {
      source
    }
  }

  // check if instance has already been visited
  // get type of value
  // ignore complex objects that don't implement the toObject method.
  // convert value to object

  return JSON.stringify({
    entry,
    instances
  })
}

export default serialize
