'use strict';

const configUtils = require('@serverless/utils/config');
const accountUtils = require('@serverless/utils/account');

module.exports = async (config, cli) => {
  cli.logLogo();

  cli.sessionStart('Logging out');

  const user = configUtils.getLoggedInUser();

  if (!user) {
    cli.sessionStop('error', 'You are already logged out');
    return null;
  }

  accountUtils.logout();

  cli.sessionStatus('Logged Out');
  cli.sessionStop('success', `Successfully logged out "${user.username}"`);

  return null;
};
