const firebase = require('firebase-tools')

const deploy = async (inputs, context) => {
  let outputs = {}

  context.log(`Deploying firebase project: ${inputs.project}`)
  await firebase.deploy({
    project: inputs.project,
    token: inputs.token,
    cwd: inputs.path
  })
  context.log('Firebase deployment complete')
  context.saveState({
    project: inputs.project
  })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Firebase: ${context.state.name}`)
  // TODO
  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
