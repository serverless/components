'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { urls, readConfigFile, writeConfigFile } = require('@serverless/platform-sdk');
const open = require('open');

module.exports = async (config, cli) => {
  // Offer nice presentation
  cli.logLogo();
  cli.sessionStart('Logging you in via your web browser');

  const sdk = new ServerlessSDK();

  const loginConfig = {
    ...urls,
  };

  // for some reason this env var is required by the SDK in order to open the browser
  process.env.DISPLAY = true;
  let { loginUrl, loginData } = await sdk.login(loginConfig); // eslint-disable-line

  cli.log();
  cli.log(
    'If your browser did not open automatically, copy & paste this url into your browser:',
    'grey'
  );
  cli.log(loginUrl, 'grey');

  open(loginUrl);

  cli.sessionStatus('Awaiting successful login in your browser');

  loginData = await loginData;

  const configFile = readConfigFile();

  // prepare login data to save it in the FS
  configFile.userId = loginData.id;
  configFile.users = configFile.users || {};
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
      username: loginData.username,
    },
  };

  // save the login data in the rc file
  writeConfigFile(configFile);

  cli.sessionStop('success', `Successfully logged in as "${loginData.username}"`);

  return null;
};
