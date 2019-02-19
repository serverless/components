const path = require('path')
const dotenv = require('dotenv')
const cli = require('./cli')
const ComponentDeclarative = require('./componentDeclarative/serverless')
const {
  errorHandler,
  fileExists,
  readFile,
  prepareCredentials,
} = require('../utils')
const components = require('../../components')

/**
 * Identifies environment variables that are known vendor credentials and finds their corresponding SDK configuration properties
 * @param {Object} config - Configuration
 * @param {String} config.root - The root path of the parent Component.
 * @param {String} config.stage - The stage you wish to set in the context.
 * @param {String} config.instance - The instance name of an immediate child Component you want to target with the CLI.  Note: This only works with serverless.yml
 * @param {String} config.method - The method you want to call on the parent Component.
 * @param {Object} config.credentials - The credentials you wish to set in the context.
 * @param {String} config.silent - If you wish to silence the CLI.
 * @param {String} config.debug - If you wish to turn on debug mode.
 */

const run = async (config = {}) => {

  // Configuration defaults
  config.root = config.root || process.cwd()
  config.stage = config.stage || 'dev'
  config.credentials = config.credentials || {}
  config.instance = config.instance || null
  config.method = config.method || null
  config.silent = config.silent || false
  config.debug = config.debug || false

  if (config.silent) process.env.SERVERLESS_SILENT = true
  if (config.debug) process.env.SERVERLESS_DEBUG = true

  // Load env vars
  let envVars = {}
  let envFile = `.env`
  let defaultEnvFilePath = path.join(process.cwd(), `.env`)
  let stageEnvFilePath = path.join(process.cwd(), `.env.${config.stage}`)
  if (await fileExists(stageEnvFilePath)) {
    envVars = dotenv.config({ path: path.resolve(stageEnvFilePath) }).parsed || {}
  } else if (await fileExists(defaultEnvFilePath)) {
    envVars = dotenv.config({ path: path.resolve(defaultEnvFilePath) }).parsed || {}
  }

  // Prepare credentials
  config.credentials = prepareCredentials(envVars)

  // Determine programmatic or declarative usage
  const serverlessJsFilePath = path.join(process.cwd(), 'serverless.js')
  const serverlessYmlFilePath = path.join(process.cwd(), 'serverless.yml')
  const serverlessYamlFilePath = path.join(process.cwd(), 'serverless.yaml')
  const serverlessJsonFilePath = path.join(process.cwd(), 'serverless.json')

  if (await fileExists(serverlessJsFilePath)) return await runProgrammatic(serverlessJsFilePath, config)
  else if (await fileExists(serverlessYmlFilePath)) return await runDeclarative(serverlessYmlFilePath, config)
  else if (await fileExists(serverlessYamlFilePath)) return await runDeclarative(serverlessYamlFilePath, config)
  else if (await fileExists(serverlessJsonFilePath)) return await runDeclarative(serverlessJsonFilePath, config)
  else {
    errorHandler(`No Serverless file (serverless.js, serverless.yml, serverless.yaml or serverless.json) found in ${process.cwd()}`)
  }
}

/**
 * Run a serverless.js file
 * @param {String} filePath - Path of the declarative file
 * @param {Object} config - Configuration
 */

const runProgrammatic = async (filePath, config) => {

  let Component, component, result

  // Load Component
  let context = {}
  context.stage = config.stage
  context.root = config.root
  context.rootFile = 'serverless.js'
  context.credentials = config.credentials
  context.silent = config.silent
  context.debug = config.debug
  Component = require(filePath)
  component = new Component({ context })

  // Start CLI
  cli.start(config.stage, Component.name)

  if (!config.method) {
    // If no method has been provided, run the default method...
    result = await component()
  } else {
    // If method has been provided, run that...
    if (!component[config.method]) {
      throw Error(`Component "${Component.name}" does not have a "${config.method}" method`)
    }
    result = await component[config.method]()
  }

  // Stop CLI
  cli.stop('done')

  return result
}

/**
 * Run a serverless.yml, serverless.yaml or serverless.json file
 * @param {String} filePath - Path of the declarative file
 * @param {Object} config - Configuration
 */

const runDeclarative = async (filePath, config) => {

  let Component, component, result
  let context = {}
  context.stage = config.stage
  context.root = config.root
  context.rootFile = path.basename(filePath)
  context.credentials = config.credentials
  context.silent = config.silent
  context.debug = config.debug

  // TODO: Handle loading errors and validate...
  const fileContent = await readFile(filePath)

  // If no config.method or config.instance has been provided, run the default method...
  if (!config.instance && !config.method) {

    // Start CLI
    cli.start(config.stage, fileContent.name)

    try {
      component = new ComponentDeclarative({
        name: fileContent.name, // Must pass in name to ComponentDeclaractive
        context,
      })
      result = await component()
    } catch (error) {
      cli.renderError(error)
      cli.stop('error', error.message)
    }
  }

  // If config.method has been provided, run that...
  if (!config.instance && config.method) {
    component = new ComponentDeclarative({
      name: fileContent.name, // Must pass in name to ComponentDeclaractive
      context,
    })
    result = await component[config.method]()
  }

  // If config.method and config.instance, load and run that component's method...
  if (config.instance && config.method) {

    let instanceName
    let componentName

    for (const instance in fileContent.components || {}) {
      let c = instance.split('::')[0]
      let i = instance.split('::')[1]
      if (config.instance === i) {
        instanceName = i
        componentName = c
      }
    }

    // Check Component instance exists in serverless.yml
    if (!instanceName) {
      throw Error(`Component instance "${config.instance}" does not exist in your project.`)
    }

    // Check Component exists
    if (!components[componentName]) {
      throw Error(`Component "${componentName}" is not a valid Component.`)
    }

    Component = components[componentName]
    component = new Component({
      name: `${fileContent.name}.${instanceName}`, // Construct correct name of child Component
      context,
    })
    result = await component[config.method]()
  }

  // Mark the cli as done if the component author hasn't done that
  if (component.cli.running) component.cli.done()

  return result
}

module.exports = run
