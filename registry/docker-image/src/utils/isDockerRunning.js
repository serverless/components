const execa = require('execa')

async function isDockerRunning() {
  return execa('docker', ['version'])
    .then(() => true)
    .catch(() => false)
}

module.exports = isDockerRunning
