const { ServerlessSDK } = require('serverless-platform-client-tencent')
const { urls } = require('@serverless/platform-sdk')
const open = require('open')
const utils = require('../utils')

module.exports = async (config, cli, command) => {
  // Offer a nice presentation
  cli.log()
  cli.logLogo()
  cli.log('Logging you in via the Browser...', 'grey')
  cli.log()

  const sdk = new ServerlessSDK()

  let instanceYaml
  let componentYaml
  let componentName
  let componentVersion
  try {
    // load serverless.yml if available
    instanceYaml = await utils.loadInstanceConfig(process.cwd())
  } catch (e) {}

  try {
    // load serverless.component.yml if available
    componentYaml = await utils.loadComponentConfig(process.cwd())
  } catch (e) {}

  // parse component name and version if available
  if (instanceYaml) {
    componentName = instanceYaml.component.split('@')[0]
    componentVersion = instanceYaml.component.split('@')[1]
  } else if (componentYaml) {
    componentName = componentYaml.name
    componentVersion = componentYaml.version
  }

  const loginConfig = {
    ...urls,
    componentName,
    componentVersion
  }

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true
  let { loginUrl, loginData } = await sdk.login(loginConfig) // eslint-disable-line

  console.log(loginUrl)
  open(loginUrl)

  loginData = await loginData

  // console.log(loginData)

  // make sure default org name is set in the rc file
  // await utils.getDefaultOrgName()

  cli.close('success', `Successfully logged in as "${loginData.username}"`)
}
