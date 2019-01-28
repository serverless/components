const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { fileExists } = require('@serverless/utils')

const run = async () => {
  if (argv.silent) {
    process.env.SERVERLESS_SILENT = 'true'
  }
  const serverlessFilePath = path.join(process.cwd(), 'serverless.js')

  console.log('')
  if (await fileExists(serverlessFilePath)) {
    // serverless.js exists in cwd
    const Component = require(serverlessFilePath)
    const component = new Component(undefined, argv)

    if (argv['_'].length === 1) {
      // run a specific function in cwd
      const command = argv['_'].shift()
      await component[command]() // todo pass inputs?
    } else {
      // run the main function in cwd
      await component() // todo pass inputs?
    }
  } else {
    // serverless.js does not exist in cwd
    // todo how to run main function in any component?
    if (argv['_'].length === 2) {
      // run specific function from specific component
      const command = argv['_'].shift()
      const componentName = argv['_'][0]

      const Component = require(path.join('..', 'components', componentName, 'serverless.js')) // todo camelCase?
      const component = new Component(undefined, argv)
      await component[command]() // todo pass inputs?
    } else {
      // sls file not found
      console.log('  no serverless.js found in cwd.')
    }
  }
  console.log('')
}

module.exports = run
