const firebase = require('firebase-tools')
const logger = require('firebase-tools/lib/logger')
const { equals } = require('ramda')
const ComponentsLogger = require('./ComponentsLogger')

const deploy = async (inputs, context) => {
  let outputs = {}

  //TODO BRN: This won't work for multiple calls to this component.
  logger
    .add(ComponentsLogger, {
      level: process.env.DEBUG ? "debug" : "info",
      showLevel: false,
      colorize: true,
      context
    })

  context.log(`Deploying firebase project: ${inputs.project}`)
  const result = await firebase.deploy({
    project: inputs.project,
    token: inputs.token,
    cwd: inputs.path
  })
  context.log('result:', result)

  if (inputs.config) {
    firebase.functions.config.set({})
  }
  context.log('Firebase deployment complete')
  context.saveState({
    project: inputs.project
  })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Firebase: ${context.state.project}`)
  // TODO: How to remove this? Perhaps deploying an empty project?
  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
