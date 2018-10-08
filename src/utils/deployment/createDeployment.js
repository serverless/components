import { map, pick } from '@serverless/utils'
import { SYMBOL_KEY } from '../constants'
import loadState from '../state/loadState'
import saveState from '../state/saveState'
import newDeployment from './newDeployment'

const createDeployment = async (previousDeployment, app) => {
  let state = {}
  let number = 1
  if (previousDeployment) {
    state = await loadState(previousDeployment)
    state = map((stateObject) => pick(['instanceId', 'key'], stateObject), state)
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
