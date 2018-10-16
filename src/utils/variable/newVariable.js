import { append, castPath, get, has, toString, walkReducePath } from '@serverless/utils'
import { SYMBOL_VARIABLE } from '../constants'
import matchVariable from './matchVariable'
import resolveVariableString from './resolveVariableString'

const newVariable = (variableString, data) => ({
  [SYMBOL_VARIABLE]: true,
  findInstances() {
    const pathParts = castPath(matchVariable(variableString).expression)
    return walkReducePath(
      (instances, value) => {
        if (has('instanceId', value)) {
          return append(value, instances)
        }
        return instances
      },
      pathParts,
      [],
      data
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
  toVariableString() {
    return variableString
  },
  valueOf() {
    return resolveVariableString(variableString, data)
  }
})

export default newVariable
