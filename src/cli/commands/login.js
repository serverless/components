const { login } = require('@serverless/platform-sdk')

module.exports = async (context) => {
  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true

  // Disable timer
  context.timer = false

  context.status('Logging in via browser')

  const res = await login()
  const { username } = res.users[res.userId]

  context.status('Logged in')
  context.close('done', `Successfully logged in as "${username}"`)
}
