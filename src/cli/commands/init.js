'use strict';
const initToken = require('./initTokens');
const setupAws = require('./setupAws');

const proTemplateMatch = /[a-zA-Z0-9]{8}/;

module.exports = async (config, cli) => {
  const maybeToken = config.params[0]
  if (!maybeToken) {
    cli.error('init command requires either a token or template URL')
  }

  if (maybeToken.match(proTemplateMatch)) {
    const serviceDir = await initToken.run(cli, config.params[0])
    await setupAws(config, cli)
    cli.close('success', `cd to '${serviceDir}' and run 'serverless dev' to get started developing!`)
  } else {
    cli.close('Registry initialization coming soon!')
  }
  return false
}
