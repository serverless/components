import { forEachIndexed, forEachObjIndexed, isArray, isObject } from '@serverless/utils'
import resolve from '../variable/resolve'

const visitVariables = (value, visited) => {
  value = resolve(value)
  if (value && !visited.has(value)) {
    if (isArray(value)) {
      visited.add(value)
      forEachIndexed((aValue, index) => (value[index] = visitVariables(aValue, visited)), value)
      visited.delete(value)
    } else if (isObject(value)) {
      visited.add(value)
      forEachObjIndexed((oValue, key) => {
        if (key !== 'children' && key !== 'inputTypes') {
          value[key] = visitVariables(oValue, visited)
        }
      }, value)
      visited.delete(value)
    }
  }
  return value
}

const resolveVariables = (value) => {
  const visited = new Set()
  return visitVariables(value, visited)
}

export default resolveVariables
