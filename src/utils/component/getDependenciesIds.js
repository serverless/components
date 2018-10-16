import isVariable from '../variable/isVariable'
import { reject, flatten, concat } from 'ramda'
import { isArray, isObject, map } from '@serverless/utils'

const getDepsIds = (value, deps = [], startId, parentIds) => {
  if (isArray(value)) {
    return map((v) => getDepsIds(v, deps, startId, parentIds), value)
  } else if (isObject(value)) {
    if (isVariable(value)) {
      return concat(deps, reject((i) => parentIds.includes(i), value.findInstances()))
    } else if (!value.instanceId || value.instanceId === startId) {
      return map((k) => getDepsIds(value[k], deps, startId, parentIds), Object.keys(value))
    }
  }
  return deps
}

const getDependenciesIds = (currentInstance, parentIds) =>
  flatten(getDepsIds(currentInstance, [], currentInstance.instanceId, parentIds))

export default getDependenciesIds
