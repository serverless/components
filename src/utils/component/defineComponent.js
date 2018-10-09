import {
  all,
  forEachIndexed,
  forEachObjIndexed,
  isArray,
  isFunction,
  isObject,
  map
} from '@serverless/utils'
import resolve from '../variable/resolve'
import appendKey from './appendKey'
import getKey from './getKey'
import hydrateComponent from './hydrateComponent'
import setKey from './setKey'

/**
 *
 */
const defineComponent = async (component, context) => {
  // TODO BRN: If we ever need to retrigger define (redefine) hydrating state here may be an issue
  component = hydrateComponent(component, context)
  if (isFunction(component.define)) {
    const children = resolve(await component.define(context)) || {}
    if (isObject(children)) {
      forEachObjIndexed((child, key) => {
        child = resolve(child)
        // TODO BRN: Look for children that already have parents. If this is the case then someone has returned a child from define that was defined by another component (possibly passed along as a variable)
        child.parent = component
        child = setKey(appendKey(getKey(component), key), child)
      }, children)
    } else if (isArray(children)) {
      forEachIndexed((child, index) => {
        child = resolve(child)
        child.parent = component
        child = setKey(appendKey(getKey(component), index), child)
      }, children)
    } else {
      throw new Error(
        `define() method must return either an object or an array. Instead received ${children} from ${component}.`
      )
    }
    component.children = await all(map((child) => defineComponent(child, context), children))
  }
  return component
}

export default defineComponent
