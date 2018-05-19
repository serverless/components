const firebase = require('firebase-tools')
const logger = require('firebase-tools/lib/logger')
const { keys, map, prop } = require('ramda')
const ComponentsLogger = require('./ComponentsLogger')

const setupLogger = () => {
  logger.add(ComponentsLogger, {
    level: process.env.DEBUG ? 'debug' : 'info',
    showLevel: false,
    colorize: true,
    context: {
      log: (...args) => {
        console.log(...args) // eslint-disable-line no-console
      }
    }
  })
}

const convertConfig = (config) =>
  map((key) => {
    const value = prop(key, config)
    return `${key}=${JSON.stringify(value)}`
  }, keys(config))

const configSet = async (inputs) => {
  setupLogger()
  await firebase.functions.config.set(convertConfig(inputs.config), {
    project: inputs.project,
    token: inputs.token,
    cwd: inputs.path
  })
}

const deploy = async (inputs) => {
  setupLogger()
  await firebase.deploy({
    project: inputs.project,
    token: inputs.token,
    cwd: inputs.path
  })
}

const commands = {
  configSet,
  deploy
}

process.on('message', (message) => {
  const command = prop(message.type, commands)
  if (!command) {
    throw new Error(`Could not find command of type ${message.type}`)
  }
  command(message.inputs, message.state)
    .then(() => process.exit())
    .catch((error) => {
      console.error(error) // eslint-disable-line no-console
      process.exit(1)
    })
})
