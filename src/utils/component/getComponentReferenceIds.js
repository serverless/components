import { append, resolve } from '@serverless/utils'
import isComponent from './isComponent'
import walkReduceComponentReferences from './walkReduceComponentReferences'

const getComponentReferenceIds = (value) => {
  const component = resolve(value)
  if (!isComponent(component)) {
    throw new TypeError(
      `getComponentReferenceIds expected a Component instance but instead received ${component}`
    )
  }
  return walkReduceComponentReferences(
    (accum, componentReference) => append(componentReference.instanceId, accum),
    [],
    component
  )
}

export default getComponentReferenceIds
