import loadState from '../state/loadState'

const createDeployment = async (previousDeployment) => {
  const state = await loadState(previousDeployment)
  const filteredState = map((stateObject) => pick(['instanceId', 'key'], stateObject), state)

  // TODO BRN: Use the previous deployment data to preserve the ids that were generated for instances.
  // generate a random id for this deployment that is a uuid based on time (incrementing)
  // TODO BRN: implement
}

export default createDeployment
