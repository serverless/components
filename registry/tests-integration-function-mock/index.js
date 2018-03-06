function deploy(inputs, context) {
  const { name, role } = inputs
  context.log(`Deploying function "${name}"`)

  const id = `id:function:${name}`
  let deploymentCounter = 1
  if (context.state && context.state.deploymentCounter) {
    // eslint-disable-next-line prefer-destructuring
    deploymentCounter = context.state.deploymentCounter
    deploymentCounter += 1
  }

  // fail on the third deployment
  if (deploymentCounter === 3) {
    throw new Error(`Failed to deploy function "${name}"`)
  }

  const newState = {
    ...context.state,
    id,
    name,
    role,
    deploymentCounter
  }
  context.saveState(newState)

  return newState
}

function invoke(inputs, context) {
  context.log(`Invoking function "${inputs.name}"`)
  const { data } = context.options

  const newState = {
    ...context.state,
    data
  }
  context.saveState(newState)

  return newState
}

function remove(inputs, context) {
  context.log(`Removing function "${inputs.name}"`)
}

module.exports = {
  deploy,
  invoke,
  remove
}
