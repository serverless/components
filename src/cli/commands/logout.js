'use strict';

const { getLoggedInUser, logout } = require('@serverless/platform-sdk');

module.exports = async (config, cli) => {
  cli.logLogo();

  cli.sessionStart('Logging out');

  const user = getLoggedInUser();

  if (!user) {
    cli.sessionStop('error', 'You are already logged out');
    return null;
  }

  await logout();

  cli.sessionStatus('Logged Out');
  cli.sessionStop('success', `Successfully logged out "${user.username}"`);

  return null;
};
