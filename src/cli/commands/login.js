'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const open = require('open');
const configUtils = require('@serverless/utils/config');

module.exports = async (config, cli) => {
  // Offer nice presentation
  cli.logLogo();
  cli.sessionStart('Logging you in via your web browser');

  const sdk = new ServerlessSDK();

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true;
  let { loginUrl, loginData } = await sdk.login(); // eslint-disable-line

  cli.log();
  cli.log(
    'If your browser did not open automatically, copy & paste this url into your browser:',
    'grey'
  );
  cli.log(loginUrl, 'grey');

  open(loginUrl);

  cli.sessionStatus('Awaiting successful login in your browser');

  loginData = await loginData;

  // In `.serverlessrc`, we want to use `user_uid` as `userId` if it's available
  const userId = loginData.user_uid || loginData.id;

  const loginDataToSaveInConfig = {
    userId,
    users: {
      [userId]: {
        userId,
        name: loginData.name,
        email: loginData.email,
        username: loginData.username,
        dashboard: {
          refreshToken: loginData.refreshToken,
          accessToken: loginData.accessToken,
          idToken: loginData.idToken,
          expiresAt: loginData.expiresAt,
          username: loginData.username,
        },
      },
    },
  };
  // save the login data in the rc file
  configUtils.set(loginDataToSaveInConfig);

  cli.sessionStop('success', `Successfully logged in as "${loginData.username}"`);

  return null;
};
