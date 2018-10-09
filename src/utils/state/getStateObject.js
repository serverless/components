import { find, has } from '@serverless/utils'
import getKey from '../component/getKey'

const getStateObject = (query, state) => {
  let stateObject = {}
  if (has('instanceId', query)) {
    stateObject = state[query.instanceId]
  } else if (getKey(query)) {
    stateObject = find((fState) => fState.key === getKey(query), state)
  }
  return stateObject
}

export default getStateObject
