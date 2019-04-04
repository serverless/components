const path = require('path')
const dotenv = require('dotenv')
const prompts = require('prompts')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const cliInstance = require('./cli')
const Context = require('./context')
const ComponentDeclarative = require('./componentDeclarative/serverless')
const {
  errorHandler,
  fileExists,
  readFile,
  copyDirContentsSync,
  coreComponentExists,
  loadComponent,
  prepareCredentials
} = require('../utils')

/**
 * Run a serverless.js file
 * @param {String} filePath - Path of the declarative file
 * @param {Object} config - Configuration
 */

const runProgrammatic = async (filePath, config, cli) => {
  let result

  // Load Component
  const context = new Context(config)

  const Component = require(filePath)

  // Config CLI
  cli.config({
    stage: config.stage,
    parentComponent: Component.name
  })

  const component = new Component({ context, cli })

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
  } catch (error) {
    return errorHandler(error, Component.name)
  }

  if (!context.watch) {
    // Cleanup CLI
    cli.close('done')
  }

  return result
}

/**
 * Run a serverless.yml, serverless.yaml or serverless.json file
 * @param {String} filePath - Path of the declarative file
 * @param {Object} config - Configuration
 */

const runDeclarative = async (filePath, config, cli) => {
  let Component, component, result

  const context = new Context(config, path.basename(filePath))

  // TODO: Handle loading errors and validate...
  const fileContent = await readFile(filePath)

  // If no config.method or config.instance has been provided, run the default method...
  if (!config.instance && !config.method) {
    // Config CLI
    cli.config({
      stage: config.stage,
      parentComponent: fileContent.name
    })

    try {
      component = new ComponentDeclarative({
        name: fileContent.name, // Must pass in name to ComponentDeclaractive
        context,
        cli
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
      parentComponent: fileContent.name
    })

    component = new ComponentDeclarative({
      name: fileContent.name, // Must pass in name to ComponentDeclaractive
      context,
      cli
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
      const c = instance.split('::')[0]
      const i = instance.split('::')[1]
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
    if (!(await coreComponentExists(componentName))) {
      throw Error(`Component "${componentName}" is not a valid Component.`)
    }

    // Config CLI
    cli.config({
      stage: config.stage,
      parentComponent: `${instanceName}`
    })

    Component = await loadComponent(componentName)
    component = new Component({
      id: `${context.stage}.${fileContent.name}.${instanceName}`, // Construct correct name of child Component
      context,
      cli
    })
    try {
      result = await component[config.method]()
    } catch (error) {
      return errorHandler(error, componentName)
    }
  }

  if (!context.watch) {
    // Cleanup CLI
    cli.close('done')
  }

  return result
}

const runPrompt = async () => {
  const selected = await prompts(
    {
      type: 'select',
      name: 'template',
      message: 'What would you like to create in this directory?',
      choices: [
        { title: 'My Own Component', value: 'component' },
        { title: 'Function', value: 'function' },
        { title: 'API', value: 'api' },
        { title: 'Website', value: 'website' },
        { title: 'Realtime Application', value: 'realtime-app' },
        { title: 'Chat Application', value: 'chat-app' },
        { title: 'Websocket Backend', value: 'websocket-backend' }
      ],
      initial: 0
    },
    {
      onCancel: () => process.exit(0)
    }
  )

  const templateDirPath = path.join(__dirname, '..', '..', 'templates', selected.template)

  copyDirContentsSync(templateDirPath, process.cwd())

  console.log(`  Successfully created "${selected.template}" in the current directory.`)
  console.log(`  Check out the generated files for some helpful instructions.`)

  if (selected.template === 'component') {
    console.log(`  Installing Dependencies...`)
    await exec('npm install')
    console.log(`  Done. You can now run "components" for a quick tour.`)
    console.log()
  }
  process.exit(0)
}

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

const run = async (config = {}, cli = cliInstance) => {
  // Configuration defaults
  config.root = config.root || process.cwd()
  config.stage = config.stage || 'dev'
  config.credentials = config.credentials || {}
  config.instance = config.instance || null
  config.method = config.method || null
  config.verbose = config.verbose || false
  config.debug = config.debug || false
  config.watch = config.watch || false

  if (config.verbose) {
    process.env.SERVERLESS_VERBOSE = true
  }
  if (config.debug) {
    process.env.SERVERLESS_DEBUG = true
  }

  // Load env vars
  let envVars = {}
  const defaultEnvFilePath = path.join(process.cwd(), `.env`)
  const stageEnvFilePath = path.join(process.cwd(), `.env.${config.stage}`)
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
    if (await fileExists(serverlessJsFilePath)) {
      return await runProgrammatic(serverlessJsFilePath, config, cli)
    } else if (await fileExists(serverlessYmlFilePath)) {
      return await runDeclarative(serverlessYmlFilePath, config, cli)
    } else if (await fileExists(serverlessYamlFilePath)) {
      return await runDeclarative(serverlessYamlFilePath, config, cli)
    } else if (await fileExists(serverlessJsonFilePath)) {
      return await runDeclarative(serverlessJsonFilePath, config, cli)
    }

    // run prompt if serverless files not found
    await runPrompt()
  } catch (error) {
    return errorHandler(error, 'Serverless Components')
  }
}

/**
 * Run a serverless.yml, serverless.yaml or serverless.json file
 * @param {String} filePath - Path of the declarative file
 * @param {Object} config - Configuration
 */

module.exports = run
