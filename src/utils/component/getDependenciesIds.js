import { concat, union, without } from '@serverless/utils'
import getChildrenIds from './getChildrenIds'
import getComponentReferenceIds from './getComponentReferenceIds'
import getParentIds from './getParentIds'
import getVariableInstanceIds from './getVariableInstanceIds'

//union this with component reference ids (the id of any component where a property in this component references that component )
const getDependenciesIds = (component) =>
  without(
    union(getParentIds(component), [component.instanceId]),
    union(
      concat(getChildrenIds(component), getVariableInstanceIds(component)),
      getComponentReferenceIds(component)
    )
  )

export default getDependenciesIds
