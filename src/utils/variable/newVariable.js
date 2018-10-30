import { append, castPath, concat, get, has, toString, walkReducePath } from '@serverless/utils'
import { SYMBOL_VARIABLE } from '../constants'
import isVariable from './isVariable'
import matchVariable from './matchVariable'
import resolveVariableString from './resolveVariableString'

const newVariable = (variableString, data) => ({
  [SYMBOL_VARIABLE]: true,
  data,
  variableString,
  findInstanceIds() {
    const pathParts = castPath(matchVariable(variableString).expression)
    return walkReducePath(
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
