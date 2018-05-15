const run = require('../run')

async function deploy(options) {
  return run('deploy', options)
}

module.exports = deploy
