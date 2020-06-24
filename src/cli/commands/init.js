'use strict';
const initializer = require('./initializer');

/**
 * Init command can ingest either a initToken (SaaS onboarding)
 * or the name of a template in the registry
 * @param {*} config
 * @param {*} cli
 */
module.exports = async (config, cli) => {
  const maybeToken = config.params[0];
  if (!maybeToken) {
    cli.error('init command requires either a token or template URL');
  }
  cli.logLogo();
  cli.log();
  const serviceDir = await initializer.run(cli, config.params[0]);
  if (serviceDir) {
    cli.close('close', `cd to '${serviceDir}' and run 'serverless deploy' to get started!`);
  }
  return;
};
