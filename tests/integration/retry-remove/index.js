async function deploy(inputs, context) {
  context.saveState({ deployed: true, triedToRemove: false })
  throw new Error('Soemthing went wrong during deployment...')
}

async function remove(inputs, context) {
  if (context.state.triedToRemove) {
    context.saveState()
  } else {
    context.saveState({
      ...context.state,
      triedToRemove: true
    })
  }
}

module.exports = {
  deploy,
  remove
}
