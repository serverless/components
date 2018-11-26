import { concat, forEach, isObjectLike, resolve, walk } from '@serverless/utils'
import isComponent from './isComponent'

const reduceWalkee = (accum, value, keys, iteratee, recur) => {
  const visited = new Set()

  let result = accum
  if (isObjectLike(value) && !visited.has(value)) {
    visited.add(value)
    forEach((childValue, childKdx) => {
      const newKeys = concat(keys, [childKdx])
      result = recur(result, resolve(childValue), newKeys, iteratee)
    }, value)
    if (isComponent(value)) {
      result = iteratee(accum, value, keys)
    }
  }
  return result
}

/**
 * ---------
 * TODO: update
 * ---------
 * Walk reduce the component and component's children using the given reducer function
 *
 * @func
 * @param {Function} fn The iterator function. Receives three values, the accumulator and the current element from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceAllComponentsDepthFirst = (iteratee, accum, component) =>
  walk(reduceWalkee, iteratee, accum, component, [])

export default walkReduceAllComponentsDepthFirst
