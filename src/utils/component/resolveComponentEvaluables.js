import { getParent, last, resolve } from '@serverless/utils'
import isComponent from './isComponent'
import walkReduceEvaluables from './walkReduceEvaluables'

const resolveComponentEvaluables = (value) => {
  const component = resolve(value)
  if (!isComponent(component)) {
    throw new TypeError(
      `resolveComponentEvaluables expected a Component instance but instead received ${component}`
    )
  }
  return walkReduceEvaluables(
    (accum, evaluable, keys) => {
      const childKey = last(keys)
      const parent = getParent(keys, accum)
      parent[childKey] = resolve(evaluable)
      return accum
    },
    component,
    component
  )
}

export default resolveComponentEvaluables
