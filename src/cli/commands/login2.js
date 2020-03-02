const { ServerlessSDK } = require('@serverless/platform-client')
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

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true
  let { loginUrl, loginData } = await sdk.login(urls) // eslint-disable-line

  console.log(loginUrl)
  open(loginUrl)

  loginData = await loginData

  // console.log(loginData)

  // make sure default org name is set in the rc file
  // await utils.getDefaultOrgName()

  cli.close('success', `Successfully logged in as "${loginData.username}"`)
}
