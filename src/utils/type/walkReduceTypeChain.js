import { concat, isNil, walk } from '@serverless/utils'

const reduceWalkee = (accum, value, keys, iteratee, recur) => {
  let result = iteratee(accum, value, keys)
  const { parent } = value
  if (!isNil(parent)) {
    const newKeys = concat(keys, ['parent'])
    result = recur(result, parent, newKeys, iteratee)
  }
  return result
}

/**
 * Walk reduce the type chain
 *
 * @function
 * @param {Function} fn The iterator function. Receives each type in the parent type chain
 * @param {*} accum The accumulator value.
 * @param {Type} type The type to walk.
 * @returns {*} The final, accumulated value.
 */
const walkReduceTypeChain = (iteratee, accum, type) => walk(reduceWalkee, iteratee, accum, type, [])

export default walkReduceTypeChain
