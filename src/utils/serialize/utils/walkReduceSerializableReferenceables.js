import { concat, forEach, isSymbol, resolve, walk } from '@serverless/utils'
import hasSymbolString from './hasSymbolString'
import isSerializableReferenceable from './isSerializableReferenceable'

const reduceWalkee = (context) => {
  const visited = new Set()

  return (accum, value, keys, iteratee, recur) => {
    let result = accum

    // TODO BRN: Should we serialize variables?
    value = resolve(value)
    if (isSerializableReferenceable(value) && !visited.has(value)) {
      visited.add(value)
      result = iteratee(result, value, keys)
      forEach((childValue, childKdx) => {
        childValue = resolve(childValue)
        if (
          isSerializableReferenceable(childValue) &&
          (!isSymbol(childKdx) || hasSymbolString(context, childKdx))
        ) {
          const newKeys = concat(keys, [childKdx])
          result = recur(result, childValue, newKeys, iteratee)
        }
      }, value)
    }
    return result
  }
}

/**
 * Walk reduce all of the objects's properties and sub properties including children that are serializable objects
 *
 * This method has cirrcular reference protection. It will not walk instances more than once.
 *
 * @function
 * @param {Function} fn The iterator function. Receives three values, the accumulator and the current variable from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceSerializableReferenceables = (iteratee, accum, component, context) =>
  walk(reduceWalkee(context), iteratee, accum, component, [])

export default walkReduceSerializableReferenceables
