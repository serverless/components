import {
  append,
  uniq,
  reduce,
  castPath,
  concat,
  get,
  has,
  toString,
  walkReducePath
} from '@serverless/utils'
import { SYMBOL_VARIABLE } from '../constants'
import extractExpressions from '../ast/extractExpressions'
import isVariable from './isVariable'
import resolveVariableString from './resolveVariableString'

const newVariable = (variableString, data) => ({
  [SYMBOL_VARIABLE]: true,
  data,
  variableString,
  findInstanceIds() {
    const body = variableString.slice(2, -1)
    const expressions = extractExpressions(body)

    return uniq(
      reduce(
        (accum, memberExpression) => {
          const pathParts = castPath(memberExpression)
          const res = walkReducePath(
            (instanceIds, value) => {
              if (isVariable(value)) {
                return concat(instanceIds, value.findInstanceIds())
              }
              if (has('instanceId', value)) {
                return append(get('instanceId', value), instanceIds)
              }
              return instanceIds
            },
            pathParts,
            [],
            data
          )
          return [...res, ...accum]
        },
        [],
        expressions
      )
    )
  },
  get(path) {
    return get(path, resolveVariableString(variableString, data))
  },
  resolve() {
    return resolveVariableString(variableString, data)
  },
  toString() {
    return toString(resolveVariableString(variableString, data))
  },
  valueOf() {
    return resolveVariableString(variableString, data)
  }
})

export default newVariable
