async function deploy(inputs, context) {
  const { name, memorySize, timeout, environment } = inputs
  let { role } = inputs
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

  // create a default role if no role is provided
  let defaultRole = false
  if (!role) {
    defaultRole = await context.load('tests-integration-iam-mock', 'defaultRole', {
      name: `${inputs.name}`
    })
    defaultRole = await defaultRole.deploy()
    role = defaultRole.id
  }

  const newState = {
    ...context.state,
    id,
    name,
    memorySize,
    timeout,
    environment,
    role,
    deploymentCounter,
    defaultRole
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

async function remove(inputs, context) {
  context.log(`Removing function "${context.state.name}"`)

  // remove the default role if used
  if (context.state.defaultRole) {
    const defaultRole = await context.load('tests-integration-iam-mock', 'defaultRole', {
      name: context.state.defaultRole.name
    })
    await defaultRole.remove()
  }

  context.saveState()
}

module.exports = {
  deploy,
  invoke,
  remove
}
