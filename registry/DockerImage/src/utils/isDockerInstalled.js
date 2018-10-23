import which from 'which'
import BbPromise from 'bluebird'

async function isDockerInstalled() {
  return BbPromise.fromCallback((callback) => {
    which('docker', callback)
  })
    .then(() => true)
    .catch(() => false)
}

export default isDockerInstalled
