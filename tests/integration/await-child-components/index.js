async function deploy(inputs, context) {
  const myFunction = await context.children.myFunction

  const newState = {
    ...context.state,
    myFunction: {
      ...myFunction
    }
  }
  context.saveState(newState)

  return newState
}

async function remove(inputs, context) {
  context.saveState()
}

module.exports = {
  deploy,
  remove
}
