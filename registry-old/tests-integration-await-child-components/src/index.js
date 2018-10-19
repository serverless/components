async function deploy(inputs, context) {
  const myFunction = await context.children.myFunction

  const functionToSave = {
    ...myFunction
  }

  delete functionToSave.promise

  const newState = {
    ...context.state,
    myFunction: functionToSave
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
