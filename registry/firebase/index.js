const { fork } = require('child_process')
const firebase = require('firebase-tools')
const logger = require('firebase-tools/lib/logger')
const { resolve } = require('path')
const { equals } = require('ramda')
const ComponentsLogger = require('./ComponentsLogger')


const runCommand = async (type, inputs, context) => {
  const command = fork(resolve(__dirname, 'command.js'), [], {
    cwd: process.cwd(),
    env: {}
  })

  const promise = new Promise((resolve, reject) => {
    command.on('close', (code) => {
      console.log('close received')
      if (code) {
        return reject(new Error(`firebase command errored with code ${code}`))
      }
      return resolve()
    })
  })

  command.send({
    type,
    inputs,
    state: context.state
  })
  return promise
}


const deploy = async (inputs, context) => {
  let outputs = {}

  if (inputs.config) {
    await runCommand('configSet', inputs, context)
  }
  await runCommand('deploy', inputs, context)

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
