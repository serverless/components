import { concat, get, keys, omit, values } from '@serverless/utils'
import { UTIL_METHODS } from '../constants'
import matchVariable from './matchVariable'

const evaluateVariableString = (variableString, data) => {
  const { exact, match, expression } = matchVariable(variableString)

  if (!match) {
    return variableString
  }

  const resolvedExpression = evaluateVariableString(expression, data)

  const self = get('this', data)
  data = omit(['this'], data)

  const params = concat(keys(data), UTIL_METHODS.KEYS)
  const args = concat(values(data), UTIL_METHODS.VALUES)
  const func = new Function(params, `return ${resolvedExpression}`)

  let value = func.apply(self, args)
  if (!exact) {
    value = variableString.replace(match, value)
  }
  return value
}

export default evaluateVariableString
