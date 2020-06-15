'use strict';
const initToken = require('./initTokens')

module.exports = async (config, cli) => {
  if (!config.params[0]) {
    console.log('leaving')
  } else {
    await initToken.run(cli, config.params[0])
  }
}
