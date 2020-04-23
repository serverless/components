const { getLoggedInUser, logout } = require('@serverless/platform-sdk')

module.exports = async (config, cli, command) => {
  cli.logLogo()

  cli.status('Logging out')

  const user = getLoggedInUser()

  if (!user) {
    cli.close('error', `You are already logged out`)
  }

  await logout()

  cli.status('Logged Out')
  cli.close('success', `Successfully logged out of "${user.username}"`)
}
