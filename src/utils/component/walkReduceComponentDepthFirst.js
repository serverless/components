import {
  concat,
  forEachIndexed,
  forEachObjIndexed,
  isArray,
  isObject,
  walk
} from '@serverless/utils'
import resolve from '../variable/resolve'

const walkee = (accum, component, keys, iteratee, recur) => {
  let result = accum
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
  return iteratee(result, component, keys)
}

/**
 * Walk depth first and reduce using the given reducer function
 *
 * @func
 * @param {Function} iteratee The iterator function. Receives three values, the accumulator and the current component from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceComponentDepthFirst = (iteratee, accum, component) =>
  walk(walkee, iteratee, accum, component, [])

export default walkReduceComponentDepthFirst
