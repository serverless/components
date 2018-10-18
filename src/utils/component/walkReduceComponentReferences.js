import {
  concat,
  forEachIndexed,
  forEachObjIndexed,
  isArray,
  isNativeObject,
  isObject,
  walk
} from '@serverless/utils'
import isComponent from './isComponent'

const reduceWalkee = () => {
  const visited = new Set()

  return (accum, value, keys, iteratee, recur) => {
    let result = accum
    if (isObject(value) && !visited.has(value)) {
      if (isArray(value)) {
        visited.add(value)
        forEachIndexed((childValue, childIndex) => {
          const newKeys = concat(keys, [childIndex])
          if (isComponent(childValue)) {
            visited.add(childValue)
            result = iteratee(result, childValue, newKeys)
          } else {
            result = recur(result, childValue, newKeys, iteratee)
          }
        }, value)
      } else if (!isNativeObject(value)) {
        visited.add(value)
        forEachObjIndexed((childValue, childKey) => {
          const newKeys = concat(keys, [childKey])
          if (isComponent(childValue)) {
            visited.add(childValue)
            result = iteratee(result, childValue, newKeys)
          } else {
            result = recur(result, childValue, newKeys, iteratee)
          }
        }, value)
      }
    }
    return result
  }
}

/**
 * Walk reduce the component's own component references. A component reference is a reference to another component at any depth of properties. If the walk encounters a component it will deliver that component to the iteratee. The walk method will not walk variables and will not walk other component's properties.
 *
 * This method has cirrcular reference protection. It will not walk instances more than once.
 *
 * @function
 * @param {Function} fn The iterator function. Receives three values, the accumulator and the current component from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceComponentReferences = (iteratee, accum, component) =>
  walk(reduceWalkee(), iteratee, accum, component, [])

export default walkReduceComponentReferences
