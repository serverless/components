import { isArray, isDate, isFunction, pick } from '@serverless/utils'
import isComponent from '../component/isComponent'

const getType = (value) => {
  if (isFunction(value.getType)) {
    return value.getType()
  }
  if (isArray(value)) {
    return {
      name: 'array'
    }
  }
  if (isDate(value)) {
    return {
      name: 'date'
    }
  }
  // if (isObject())
}

// NOTE BRN: This method belongs here and not in utils because the core has to have an understanding of how it serialized things and has to deal with backward compatability of older versions of serialized data. Will need a way of determining which serialization version was used. Later, this would probably be something that belongs in an SDK.

const serializeInstance = (value, context) => {
  const { instances } = context
  const refKey = context.generateRefKey(value)
  let instance = instances[refKey]
  if (!instance) {
    const type = getType(value)

    instance = pick(['name', 'source'], type)
  }
  return instance
}

const generateRefKey = (object, context) => {
  if (context.references.has(object)) {
    return context.references.get(object)
  }
  context.refNumber = context.refNumber + 1
  const refKey = `@@ref-${context.refNumber}`
  context.references.set(object, refKey)
  return refKey
}

const createContext = (context = {}) => {
  context = {
    instances: {},
    refNumber: 0,
    references: new WeakMap(),
    ...context
  }

  const finalContext = {
    ...context,
    generateRefKey: (object) => generateRefKey(object, finalContext),
    serializeInstance: (instance) => serializeInstance(instance, finalContext)
  }
  return finalContext
}

const serialize = (value) => {
  const context = createContext()
  if (!isComponent(value)) {
    throw new TypeError(
      `serialize method expects a Component instance. Instead it received ${value}`
    )
  }
  const data = serializeInstance(value, context)

  // check if instance has already been visited
  // get type of value
  // ignore complex objects that don't implement the toObject method.
  // convert value to object

  return JSON.stringify(data)
}

export default serialize
