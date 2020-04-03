const { ServerlessSDK } = require('@serverless/platform-client')
const { urls, readConfigFile, writeConfigFile } = require('@serverless/platform-sdk')
const open = require('open')
const { loadInstanceConfig } = require('./utils')
const { loadComponentConfig } = require('../utils')

module.exports = async (config, cli, command) => {
  // Offer a nice presentation

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
    instanceYaml = await loadInstanceConfig(process.cwd())
  } catch (e) {}

  try {
    // load serverless.component.yml if available
    componentYaml = await loadComponentConfig(process.cwd())
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

  cli.log(
    'If your browser did not open automatically, copy & paste this url into your browser:',
    'grey'
  )
  cli.log(loginUrl, 'grey')

  open(loginUrl)

  loginData = await loginData

  const configFile = readConfigFile()

  // prepare login data to save it in the FS
  configFile.userId = loginData.id
  configFile.users = configFile.users || {}
  configFile.users[loginData.id] = {
    userId: loginData.id,
    name: loginData.name,
    email: loginData.email,
    username: loginData.username,
    dashboard: {
      refreshToken: loginData.refreshToken,
      accessToken: loginData.accessToken,
      idToken: loginData.idToken,
      expiresAt: loginData.expiresAt,
      username: loginData.username
    }
  }

  // save the login data in the rc file
  writeConfigFile(configFile)

  cli.close('success', `Successfully logged in as "${loginData.username}"`)
}
