const { getLoggedInUser, logout } = require('@serverless/platform-sdk')

module.exports = async (context) => {
  context.status('Logging out')

  const user = getLoggedInUser()

  if (!user) {
    context.close('done', `You are already logged out`)
  }

  await logout()

  context.status('Logged Out')
  context.close('done', `Successfully logged out of "${user.username}"`)
}
