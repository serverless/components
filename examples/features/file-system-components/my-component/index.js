function deploy(inputs, context) {
  context.log(`Deploying custom component "${inputs.name}"...`)
  const newState = {
    ...context.state,
    updatedAt: +new Date()
  }
  context.saveState(newState)
  return newState
}

function remove(inputs, context) {
  context.log(`Removing custom component "${inputs.name}"...`)
  context.saveState()
}

module.exports = {
  deploy,
  remove
}
