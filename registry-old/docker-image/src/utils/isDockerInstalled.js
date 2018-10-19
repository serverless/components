const which = require('which')
const BbPromise = require('bluebird')

async function isDockerInstalled() {
  return BbPromise.fromCallback((callback) => {
    which('docker', callback)
  })
    .then(() => true)
    .catch(() => false)
}

module.exports = isDockerInstalled
