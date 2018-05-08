const BbPromise = require('bluebird')

async function deploy(inputs, context) {
  context.log(`Deploying slow function "${inputs.name}"...`)

  // waiting for a couple of seconds...
  await BbPromise.delay(10000)

  const newState = {
    ...context.state,
    updatedAt: +new Date()
  }
  context.saveState(newState)
  return newState
}

function remove(inputs, context) {
  context.log(`Removing slow function "${inputs.name}"...`)
  context.saveState()
}

module.exports = {
  deploy,
  remove
}
