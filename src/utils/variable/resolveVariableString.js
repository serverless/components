import { get, toString } from '@serverless/utils'
import matchVariable from './matchVariable'

const resolveVariableString = (variableString, data) => {
  const { exact, expression, match } = matchVariable(variableString)
  if (!match) {
    return variableString
  }
  const resolvedExpression = resolveVariableString(expression, data)
  let value = get(resolvedExpression, data)
  if (!exact) {
    value = variableString.replace(match, toString(value))
  }
  return value
}

export default resolveVariableString
