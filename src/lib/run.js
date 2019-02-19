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
 * @param {String} config.verbose - If you wish to see outputs of all child Components.
 * @param {String} config.debug - If you wish to turn on debug mode.
 */

const run = async (config = {}) => {

  // Configuration defaults
  config.root = config.root || process.cwd()
  config.stage = config.stage || 'dev'
  config.credentials = config.credentials || {}
  config.instance = config.instance || null
  config.method = config.method || null
  config.verbose = config.verbose || false
  config.debug = config.debug || false

  if (config.verbose) process.env.SERVERLESS_VERBOSE = true
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

  try {
    if (await fileExists(serverlessJsFilePath)) return await runProgrammatic(serverlessJsFilePath, config)
    else if (await fileExists(serverlessYmlFilePath)) return await runDeclarative(serverlessYmlFilePath, config)
    else if (await fileExists(serverlessYamlFilePath)) return await runDeclarative(serverlessYamlFilePath, config)
    else if (await fileExists(serverlessJsonFilePath)) return await runDeclarative(serverlessJsonFilePath, config)
    else {
      throw new Error(`No Serverless file (serverless.js, serverless.yml, serverless.yaml or serverless.json) found in ${process.cwd()}`)
    }
  } catch (error) {
    return errorHandler(error, 'Serverless Framework')
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
  context.verbose = config.verbose
  context.debug = config.debug
  Component = require(filePath)
  component = new Component({ context })

  // Config CLI
  cli.config({
    stage: config.stage,
    parentComponent: Component.name,
  })

  try {
    // If method was provided, but doesn't exist, throw error
    if (config.method && !component[config.method]) {
      throw new Error(`Component "${Component.name}" does not have a "${config.method}" method`)
    }

    if (!config.method) {
      result = await component()
    } else {
      result = await component[config.method]()
    }
  } catch(error) {
    return errorHandler(error, Component.name)
  }

  // Cleanup CLI
  cli.close('done')

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
  context.verbose = config.verbose
  context.debug = config.debug

  // TODO: Handle loading errors and validate...
  const fileContent = await readFile(filePath)

  // If no config.method or config.instance has been provided, run the default method...
  if (!config.instance && !config.method) {

    // Config CLI
    cli.config({
      stage: config.stage,
      parentComponent: fileContent.name,
    })

    try {
      component = new ComponentDeclarative({
        name: fileContent.name, // Must pass in name to ComponentDeclaractive
        context,
      })
      result = await component()
    } catch (error) {
      return errorHandler(error, fileContent.name)
    }
  }

  // If config.method has been provided, run that...
  if (!config.instance && config.method) {

    // Config CLI
    cli.config({
      stage: config.stage,
      parentComponent: fileContent.name,
    })

    component = new ComponentDeclarative({
      name: fileContent.name, // Must pass in name to ComponentDeclaractive
      context,
    })
    try {
      result = await component[config.method]()
    } catch (error) {
      return errorHandler(error, fileContent.name)
    }
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

    // Config CLI
    cli.config({
      stage: config.stage,
      parentComponent: `${instanceName}`,
    })

    Component = components[componentName]
    component = new Component({
      id: `${context.stage}.${fileContent.name}.${instanceName}`, // Construct correct name of child Component
      context,
    })
    try {
      result = await component[config.method]()
    } catch (error) {
      return errorHandler(error, componentName)
    }
  }

  // Cleanup CLI
  cli.close('done')

  return result
}

module.exports = run
