import { get } from '@serverless/utils'
import matchVariable from './matchVariable'

const resolveVariableString = (variableString, data) => {
  const { exact, match, expression } = matchVariable(variableString)

  if (!match) {
    return variableString
  }

  const resolvedExpression = resolveVariableString(expression, data)
  let value = get(resolvedExpression, data)
  if (!exact) {
    // remove the `${}` parts from the match
    const funcBody = match.slice(2, -1)
    const params = Object.keys(data)
    const args = Object.values(data)

    let self = this
    if (params.includes('this')) {
      const thisPos = params.indexOf('this')
      self = args[thisPos]
      // remove `this` value(s) from the params and args array
      params.splice(thisPos, 1)
      args.splice(thisPos, 1)
    }

    const func = new Function(params, `return ${funcBody}`)
    const res = func.apply(self, args)

    value = variableString.replace(match, res)
  }

  return value
}

export default resolveVariableString
