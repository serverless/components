const { login } = require('@serverless/platform-sdk')
const utils = require('../utils')

module.exports = async (config, cli, command) => {
  // Offer a nice presentation
  cli.log()
  cli.logLogo()
  cli.log('Logging you in via the Browser...', 'grey')
  cli.log()

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true
  const res = await login()
  const { username } = res.users[res.userId]

  // make sure default org name is set in the rc file
  await utils.getDefaultOrgName()

  cli.close('success', `Successfully logged in as "${username}"`)
}
