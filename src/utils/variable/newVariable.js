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
import errorBadVariableEvaluation from './errors/errorBadVariableEvaluation'
import extractExpressions from '../ast/extractExpressions'
import isVariable from './isVariable'
import evaluateVariableString from './evaluateVariableString'

const newVariable = (variableString, data) => {
  const variable = {
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
      return get(path, variable.evaluate())
    },
    evaluate() {
      try {
        return evaluateVariableString(variableString, data)
      } catch (error) {
        throw errorBadVariableEvaluation(variable, error)
      }
    },
    resolve() {
      return variable.evaluate()
    },
    toString() {
      return toString(variable.evaluate())
    },
    valueOf() {
      return variable.evaluate()
    }
  }
  return variable
}

export default newVariable
