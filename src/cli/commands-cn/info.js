/*
 * CLI: Command: INFO
 */

const path = require('path')
const { ServerlessSDK } = require('@serverless/platform-client-china')
const utils = require('./utils')
const chalk = require('chalk')
const moment = require('moment')

module.exports = async (config, cli) => {
  // Start CLI persistance status
  cli.start('Initializing', { timer: false })

  await utils.login()

  // Load YAML
  let instanceDir = process.cwd()
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target)
  }
  const instanceYaml = await utils.loadInstanceConfig(instanceDir)

  // Presentation
  cli.logLogo()
  cli.log()

  cli.status('Initializing', instanceYaml.name)

  // initialize SDK
  const sdk = new ServerlessSDK()

  // don't show the status in debug mode due to formatting issues
  if (!config.debug) {
    cli.status('Loading Info', null, 'white')
  }

  // Fetch info
  let instance = await sdk.getInstance(
    instanceYaml.org,
    instanceYaml.stage,
    instanceYaml.app,
    instanceYaml.name
  )

  instance = instance.instance // eslint-disable-line

  // Throw a helpful error if the instance was not deployed
  if (!instance) {
    throw new Error(
      `Instance "${instanceYaml.name}" is not active. Please deploy the instance first, then run "serverless info" again.`
    )
  }

  // format last action for better UX
  const lastActionAgo = moment(instance.lastActionAt).fromNow()

  // show the most important information, and link to the dashboard
  cli.log(`${chalk.grey('Status:')}       ${instance.instanceStatus}`)
  cli.log(`${chalk.grey('Last Action:')}  ${instance.lastAction} (${lastActionAgo})`)
  cli.log(`${chalk.grey('Deployments:')}  ${instance.instanceMetrics.deployments}`)
  // const dashboardUrl = utils.getInstanceDashboardUrl(instanceYaml)
  // cli.log(`${chalk.grey('More Info:')}    ${dashboardUrl}`)

  // show state only in debug mode
  if (config.debug) {
    cli.log()
    cli.log(`${chalk.grey('State:')}`)
    cli.log()
    cli.logOutputs(instance.state)
    cli.log()
    cli.log(`${chalk.grey('Outputs:')}`)
  }

  cli.log()
  cli.logOutputs(instance.outputs)

  cli.close('success', 'Info successfully loaded')
}
