import { find, has } from '@serverless/utils'
import getKey from '../component/getKey'

const getState = (query, state) => {
  if (has('instanceId', query)) {
    const stateObject = state[query.instanceId]
    if (stateObject && stateObject.state) {
      return stateObject.state || {}
    }
  } else if (getKey(query)) {
    const stateObject = find((fState) => fState.key === getKey(query), state)
    if (stateObject && stateObject.state) {
      return stateObject.state || {}
    }
  }
  return {}
}

export default getState
