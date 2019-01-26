const path = require('path')
const chalk = require('chalk')
const logUpdate = require('log-update')
const argv = require('minimist')(process.argv.slice(2))
const utils = require('@serverless/utils')
const { fileExists, readFile, writeFile } = utils

const getCli = (id) => {
  const cli = {
    status: (msg, color = 'yellow') =>
      logUpdate(`  ${chalk.gray('Status:')}  ${chalk[color](msg)}`),
    success: (msg) => cli.status(msg, 'green'),
    fail: (msg) => cli.status(msg, 'red'),
    log: (msg) => (id.includes('.') ? {} : console.log(`   ${msg}`)),
    output: (name, value) => (id.includes('.') ? {} : cli.log(`${chalk.grey(`${name}: `)}${value}`))
  }
  if (process.env.SERVERLESS_SILENT) {
    return Object.keys(cli).reduce((accum, method) => {
      accum[method] = () => {} // silent all functions
    }, {})
  }

  return cli
}

const readState = async (id) => {
  const stateFilePath = path.join(process.cwd(), '.serverless', `${id}.json`)
  if (await fileExists(stateFilePath)) {
    return readFile(stateFilePath)
  }
  return {}
}

const writeState = async (id, state = {}) => {
  const stateFilePath = path.join(process.cwd(), '.serverless', `${id}.json`)
  return writeFile(stateFilePath, state)
}

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

module.exports = { ...utils, getCli, readState, writeState, run, chalk }
