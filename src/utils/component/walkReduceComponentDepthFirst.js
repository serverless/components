import concat from './concat'
import forEachIndexed from './forEachIndexed'
import forEachObjIndexed from './forEachObjIndexed'
import isArray from './isArray'
import isObject from './isObject'
import walk from './walk'

const walkee = (accum, component, keys, iteratee, recur) => {
  let result = accum
  const { children } = component
  if (isArray(children)) {
    forEachIndexed((child, childIndex) => {
      const newKeys = concat(keys, [childIndex])
      result = recur(result, child, newKeys, iteratee)
    }, children)
  } else if (isObject(children)) {
    forEachObjIndexed((child, childKey) => {
      const newKeys = concat(keys, [childKey])
      result = recur(result, child, newKeys, iteratee)
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
const walkReduceDepthFirst = (iteratee, accum, component) =>
  walk(walkee, iteratee, accum, component, [])

export default walkReduceDepthFirst
