function deploy(inputs, options, state, context) {
  const { name } = inputs
  context.log(`Deploying function "${name}"`)

  const id = `id:function:${name}`
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

function invoke(inputs, options, state, context) {
  context.log(`Invoking function "${inputs.name}"`)
  const { data } = options

  return {
    data
  }
}

function remove(inputs, options, state, context) {
  context.log(`Removing function "${inputs.name}"`)
  return {
    ...state
  }
}

module.exports = {
  deploy,
  invoke,
  remove
}
