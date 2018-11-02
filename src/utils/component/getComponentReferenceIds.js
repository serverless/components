import { append, isNil, resolve } from '@serverless/utils'
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
    (accum, componentReference) => {
      const { instanceId } = componentReference
      if (isNil(instanceId)) {
        throw new Error(
          `Found a Component reference without an instanceId while getting reference ids. This should not happen. The reference was ${componentReference} and belongs to component ${component}`
        )
      }
      return append(instanceId, accum)
    },
    [],
    component
  )
}

export default getComponentReferenceIds
