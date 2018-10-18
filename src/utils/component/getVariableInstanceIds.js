import { concat, resolve } from '@serverless/utils'
import isComponent from './isComponent'
import walkReduceComponentOwnVariables from './walkReduceComponentOwnVariables'

const getVariableInstanceIds = (value) => {
  const component = resolve(value)
  if (!isComponent(component)) {
    throw new TypeError(
      `getVariableInstanceIds expected a Component instance but instead received ${component}`
    )
  }
  return walkReduceComponentOwnVariables(
    (accum, variable) => concat(accum, variable.findInstanceIds()),
    [],
    component
  )
}

export default getVariableInstanceIds
