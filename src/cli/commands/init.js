'use strict';
const initializer = require('./initializer');

module.exports = async (config, cli) => {
  const maybeToken = config.params[0]
  if (!maybeToken) {
    cli.error('init command requires either a token or template URL')
  }

  const serviceDir = await initializer.run(cli, config.params[0])
  cli.close('success', `cd to '${serviceDir}' and run 'serverless dev' to get started developing!`)
  return
}
