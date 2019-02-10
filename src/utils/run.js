const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const fileExists = require('./fs/fileExists')
const components = require('../../components')

// it's helpful to completely silent the cli
// during development and debugging
if (argv.silent) {
  process.env.SERVERLESS_SILENT = 'true'
  delete argv.silent // so that it's not passed to components
}

let stage = 'dev'
if (argv.stage) {
  stage = argv.stage // eslint-disable-line
  delete argv.stage
}

const runComponent = async (Component, inputs = {}, method) => {
  const component = new Component({
    stage,
    silent: false
  })
  try {
    if (method && !component[method]) {
      throw Error(`Component "${Component.name}" does not have a "${method}" method`)
    }

    if (!method) {
      await component(inputs)
    } else {
      await component[method](inputs)
    }

    if (component.cli.running) {
      component.cli.done() // mark the cli as done if the component author hasn't done that
    }
  } catch (e) {
    if (component.cli.running) {
      component.cli.error(e) // mark the cli as error if it's running
    } else {
      // otherwise, just output the error
      console.log(e.stack) // eslint-disable-line
    }
  }
}

/*
 * "serverless" -> run default function in cwd
 * "serverless connect socket" -> run connect function in socket component, even if there's serverless.js in cwd
 * "serverless connect" -> run connect function in cwd
 * "serverless socket" -> if cwd has serverless.js, run "socket" function,
 *                        if not and "socket" component exists, run the default function in socket component
 */
const run = async () => {
  if (argv['_'].length < 2) {
    // eg. "serverless connect" or "serverless socket"
    // when using it programmatically
    const serverlessJsFilePath = path.join(process.cwd(), 'serverless.js')

    // when using it declarative via a config file
    const serverlessYmlFilePath = path.join(process.cwd(), 'serverless.yml')
    const serverlessYamlFilePath = path.join(process.cwd(), 'serverless.yaml')
    const serverlessJsonFilePath = path.join(process.cwd(), 'serverless.json')

    if (await fileExists(serverlessJsFilePath)) {
      // serverless.js exists in cwd
      const Component = require(serverlessJsFilePath)

      if (argv['_'].length === 1) {
        // run the specified function from cwd Component. eg. "serverless connect"
        const command = argv['_'].shift()
        await runComponent(Component, argv, command)
      } else {
        // run the default function in cwd. eg. "serverless"
        await runComponent(Component, argv)
      }
    } else if (
      (await fileExists(serverlessYmlFilePath)) ||
      (await fileExists(serverlessJsonFilePath)) ||
      (await fileExists(serverlessYamlFilePath))
    ) {
      // run the Components component
      if (argv['_'].length === 0) {
        // run the default function of the Components component
        await runComponent(components['Components'], argv)
      } else if (argv['_'].length === 1 && argv['_'][0] === 'remove') {
        // run the remove function of the Components component
        await runComponent(components['Components'], argv, 'remove')
      }
    } else if (argv['_'].length === 1 && typeof components[argv['_'][0]] !== 'undefined') {
      // serverless.js does not exist in cwd & component exists in registry
      // eg. running "serverless socket" in directory that does not have serverless.js
      // in that case, run the default function in the socket component

      await runComponent(components[argv['_'][0]], argv)
    } else {
      console.log('  no serverless.js found in cwd.') // eslint-disable-line
    }
  } else {
    // run specific function from specific component
    const command = argv['_'].shift()
    const componentName = argv['_'][0]

    if (typeof components[componentName] !== 'undefined') {
      // component exists in registry
      await runComponent(components[componentName], argv, command)
    } else {
      console.log(`  Component ${componentName} does not exist`) // eslint-disable-line
    }
  }
}

module.exports = run
