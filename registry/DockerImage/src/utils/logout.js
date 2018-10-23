import execa from 'execa'
import { DOCKER_HUB_URL } from './constants'

async function logout(registryUrl) {
  if (registryUrl === DOCKER_HUB_URL) {
    registryUrl = null
  }
  // filter out null values in args
  const args = ['logout', registryUrl].filter((arg) => arg)
  await execa('docker', args)
  return true
}

export default logout
