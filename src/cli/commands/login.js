const { login } = require('@serverless/platform-sdk')

module.exports = async (config, cli, command) => {
  cli.status('Logging in via browser')

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true
  const res = await login()
  const { username } = res.users[res.userId]

  cli.status('Logged in')
  cli.close('done', `Successfully logged in as "${username}"`)
}
