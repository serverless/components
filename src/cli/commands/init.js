'use strict';
const initToken = require('./initTokens')

const proTemplateMatch = /[a-zA-Z0-9]{8}/;

module.exports = async (config, cli) => {
  const maybeToken = config.params[0]
  if (!maybeToken) {
    cli.error('init command requires either a token or template URL')
  }

  if (maybeToken.match(proTemplateMatch)) {
    return await initToken.run(cli, config.params[0])
  }
  return false
}
