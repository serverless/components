import execa from 'execa'

async function isDockerRunning() {
  return execa('docker', ['version'])
    .then(() => true)
    .catch(() => false)
}

export default isDockerRunning
