import { concat, forEach, isObjectLike, resolve, walk, isEmpty } from '@serverless/utils'
import isComponent from './isComponent'

const reduceWalkee = (accum, value, keys, iteratee, recur) => {
  const visited = new Set()

  let result = accum
  if (isObjectLike(value) && !visited.has(value)) {
    visited.add(value)
    if (!isComponent(value) || isEmpty(keys)) {
      forEach((childValue, childKdx) => {
        const newKeys = concat(keys, [childKdx])
        result = recur(result, resolve(childValue), newKeys, iteratee)
      }, value)
    } else {
      result = iteratee(accum, value, keys)
    }
  }
  return result
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
const walkReduceComponentChildrenDepthFirst = (iteratee, accum, component) =>
  walk(reduceWalkee, iteratee, accum, component, [])

export default walkReduceComponentChildrenDepthFirst
