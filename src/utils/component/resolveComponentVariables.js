import { getParent, last, resolve } from '@serverless/utils'
import isComponent from './isComponent'
import walkReduceVariables from './walkReduceVariables'

const resolveComponentVariables = (value) => {
  const component = resolve(value)
  if (!isComponent(component)) {
    throw new TypeError(
      `resolveComponentVariables expected a Component instance but instead received ${component}`
    )
  }
  return walkReduceVariables(
    (accum, variable, keys) => {
      const childKey = last(keys)
      const parent = getParent(keys, accum)
      parent[childKey] = resolve(variable)
      return accum
    },
    component,
    component
  )
}

export default resolveComponentVariables
