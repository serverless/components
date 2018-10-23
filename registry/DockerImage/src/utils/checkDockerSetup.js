import isDockerInstalled from './isDockerInstalled'
import isDockerRunning from './isDockerRunning'

async function checkDockerSetup() {
  if (!(await isDockerInstalled())) {
    throw new Error(
      'Docker not installed. Please install Docker on your machine (see: https://docker.com)...'
    )
  }

  if (!(await isDockerRunning())) {
    throw new Error(
      'Docker not running. Please make sure to run the Docker deamon before continuing...'
    )
  }

  return true
}

export default checkDockerSetup
