function deploy(inputs, options, state, context) {
  const { name } = inputs
  context.log(`Deploying role "${name}"`)

  const id = `id:iam:role:${name}`
  let deploymentCounter = 1
  if (state && state.deploymentCounter) {
    // eslint-disable-next-line prefer-destructuring
    deploymentCounter = state.deploymentCounter
    deploymentCounter += 1
  }

  return {
    id,
    deploymentCounter
  }
}

function remove(inputs, options, state, context) {
  context.log(`Removing role "${inputs.name}"`)
  return {
    ...state
  }
}

module.exports = {
  deploy,
  remove
}
