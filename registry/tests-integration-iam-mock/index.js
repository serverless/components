function deploy(inputs, context) {
  const { name } = inputs
  context.log(`Deploying role "${name}"`)

  const id = `id:iam:role:${name}`
  let deploymentCounter = 1
  if (context.state && context.state.deploymentCounter) {
    // eslint-disable-next-line prefer-destructuring
    deploymentCounter = context.state.deploymentCounter
    deploymentCounter += 1
  }

  const newState = {
    ...context.state,
    id,
    name,
    deploymentCounter
  }
  context.saveState(newState)

  return newState
}

function remove(inputs, context) {
  context.log(`Removing role "${inputs.name}"`)
  context.saveState()
}

module.exports = {
  deploy,
  remove
}
