import {
  concat,
  forEachIndexed,
  forEachObjIndexed,
  isArray,
  isObject,
  walk
} from '@serverless/utils'
import resolve from '../variable/resolve'

const reduceWalkee = (accum, component, keys, iteratee, recur) => {
  let result = iteratee(accum, component, keys)
  const children = resolve(component.children)
  if (isArray(children)) {
    forEachIndexed((child, childIndex) => {
      const newKeys = concat(keys, [childIndex])
      result = recur(result, resolve(child), newKeys, iteratee)
    }, children)
  } else if (isObject(children)) {
    forEachObjIndexed((child, childKey) => {
      const newKeys = concat(keys, [childKey])
      result = recur(result, resolve(child), newKeys, iteratee)
    }, children)
  }
  return result
}

/**
 * Walk reduce the component and component's children using the given reducer function
 *
 * @func
 * @param {Function} fn The iterator function. Receives three values, the accumulator and the current element from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceComponent = (iteratee, accum, component) =>
  walk(reduceWalkee, iteratee, accum, component, [])

export default walkReduceComponent
