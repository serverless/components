import { get, toString } from '@serverless/utils'
import matchVariable from './matchVariable'

const resolveVariable = (variableString, data) => {
  const { exact, expression } = matchVariable(variableString)
  let value = get(expression, data)
  if (!exact) {
    value = variableString.replace(regex, toString(value))
  }
  return value
}

export default resolveVariable
