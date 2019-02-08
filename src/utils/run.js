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
      const component = new Component(undefined, true)

      if (argv['_'].length === 1) {
        // run the specified function from cwd Component. eg. "serverless connect"
        const command = argv['_'].shift()

        if (!component[command]) {
          console.log(`  Component in cwd does not have a "${command}" method`) // eslint-disable-line
          return
        }
        await component[command](argv || {})
      } else {
        // run the default function in cwd. eg. "serverless"
        await component(argv || {})
      }

      if (component.cli.running) {
        component.cli.done()
      }
    } else if (
      (await fileExists(serverlessYmlFilePath)) ||
      (await fileExists(serverlessJsonFilePath)) ||
      (await fileExists(serverlessYamlFilePath))
    ) {
      const component = new components['Components'](undefined, true)
      if (argv['_'].length === 0) {
        await component(argv || {})
      } else if (argv['_'].length === 1 && argv['_'][0] === 'remove') {
        await component['remove'](argv || {})
      }

      if (component.cli.running) {
        component.cli.done()
      }
    } else if (argv['_'].length === 1 && typeof components[argv['_'][0]] !== 'undefined') {
      // serverless.js does not exist in cwd & component exists in registry
      // eg. running "serverless socket" in directory that does not have serverless.js
      // in that case, run the default function in the socket component

      const component = new components[argv['_'][0]](undefined, true)
      await component(argv || {})

      if (component.cli.running) {
        component.cli.done()
      }
    } else {
      console.log('  no serverless.js found in cwd.') // eslint-disable-line
    }
  } else {
    // run specific function from specific component
    const command = argv['_'].shift()
    const componentName = argv['_'][0]

    if (typeof components[componentName] !== 'undefined') {
      // component exists in registry
      const component = new components[componentName](undefined, true)
      await component[command](argv || {})

      if (component.cli.running) {
        component.cli.done()
      }
    } else {
      console.log(`  Component ${componentName} does not exist`) // eslint-disable-line
    }
  }
}

module.exports = run
