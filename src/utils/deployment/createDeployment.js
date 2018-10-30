import loadState from '../state/loadState'
import saveState from '../state/saveState'
import newDeployment from './newDeployment'

const createDeployment = async (previousDeployment, app) => {
  const state = {
    previousInstance: null,
    instance: {}
  }
  let number = 1
  if (previousDeployment) {
    const previousState = await loadState(previousDeployment)
    state.previousInstance = previousState.instance
    state.instance = previousState.instance
    number = previousDeployment.number + 1
  }
  const id = `${app.id}-${number}`
  const deployment = newDeployment({
    app,
    id,
    number
  })

  // TODO BRN: Handle parallel collisions here. If another process is trying to create the same file we should error out here.
  await saveState(deployment, state)
  return deployment
}

export default createDeployment
