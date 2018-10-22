import { concat, forEach, isArray, isNativeObject, isObject, walk } from '@serverless/utils'
import isVariable from '../variable/isVariable'
import isComponent from './isComponent'

const reduceWalkee = () => {
  const visited = new Set()

  return (accum, value, keys, iteratee, recur) => {
    let result = accum
    if (isObject(value) && !visited.has(value)) {
      if (isVariable(value)) {
        visited.add(value)
        result = iteratee(result, value, keys)
      } else if (isArray(value) || !isNativeObject(value)) {
        visited.add(value)
        forEach((childValue, childKdx) => {
          if (!isComponent(childValue)) {
            const newKeys = concat(keys, [childKdx])
            result = recur(result, childValue, newKeys, iteratee)
          }
        }, value)
      }
    }
    return result
  }
}

/**
 * Walk reduce the component's own variables. A component's "own" variables are determined by walking the component's properties until either a variable is encountered or another component instance is encountered. If another component instance is found the walk will not walk to that component's properties. If a variable is found it will be fed to the iteratee method along with the path to that variable.
 *
 * This method has cirrcular reference protection. It will not walk instances more than once.
 *
 * @function
 * @param {Function} fn The iterator function. Receives three values, the accumulator and the current variable from the walk and the current set of keys from the entire depth of the walk.
 * @param {*} accum The accumulator value.
 * @param {Component} component The component to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceComponentOwnVariables = (iteratee, accum, component) =>
  walk(reduceWalkee(), iteratee, accum, component, [])

export default walkReduceComponentOwnVariables
