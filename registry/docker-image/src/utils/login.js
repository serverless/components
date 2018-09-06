const execa = require('execa')
const { DOCKER_HUB_URL } = require('./constants')

async function login(username, password, registryUrl) {
  if (registryUrl === DOCKER_HUB_URL) registryUrl = null
  // filter out null values in args
  const args = ['login', '--username', username, '--password', password, registryUrl].filter(
    (arg) => arg
  )
  await execa('docker', args)
  return true
}

module.exports = login
