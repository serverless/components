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

  context.saveState({
    ...context.state,
    id,
    name,
    deploymentCounter
  })
}

function remove(inputs, context) {
  context.log(`Removing role "${inputs.name}"`)
}

module.exports = {
  deploy,
  remove
}
