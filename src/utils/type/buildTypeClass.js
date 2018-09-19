import { forEach, get, mix } from '@serverless/utils'
import Base from './Base'

const overrideClassMethods = (Class) => {
  forEach((methodName) => {
    if (methodName !== 'constructor') {
      const method = Class.prototype[methodName]
      Class.prototype[methodName] = function(...args) {
        return method.call(this, this, ...args)
      }
    }
  }, Object.getOwnPropertyNames(Class.prototype))
  return Class
}

const buildTypeClass = (type, context) => {
  const { main, props, parent } = type
  const ParentClass = get('class', parent) || Base
  let Class = mix(ParentClass, context).with(main)
  Class = overrideClassMethods(Class)
  Object.defineProperty(Class, 'name', { value: props.name })
  return Class
}

export default buildTypeClass
