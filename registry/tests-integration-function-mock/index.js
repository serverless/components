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

  context.saveState({
    ...context.state,
    id,
    name,
    role,
    deploymentCounter
  })
}

function invoke(inputs, context) {
  context.log(`Invoking function "${inputs.name}"`)
  const { data } = context.options

  context.saveState({
    ...context.state,
    data
  })
}

function remove(inputs, context) {
  context.log(`Removing function "${inputs.name}"`)
}

module.exports = {
  deploy,
  invoke,
  remove
}
