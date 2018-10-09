import { dirExists, last, readdirDirectoryNames, sort } from '@serverless/utils'
import { join } from 'path'
import loadDeployment from './loadDeployment'
import parseDeploymentNumber from './parseDeploymentNumber'

const loadPreviousDeployment = async (app) => {
  const { project } = app
  const deploymentsDir = join(project.path, '.serverless', 'apps', app.id, 'deployments')

  if (await dirExists(deploymentsDir)) {
    let deploymentIds = await readdirDirectoryNames(deploymentsDir)
    deploymentIds = sort((idA, idB) => {
      const numberA = parseDeploymentNumber(idA)
      const numberB = parseDeploymentNumber(idB)
      if (numberA < numberB) {
        return -1
      }
      if (numberA > numberB) {
        return 1
      }
      return 0
    }, deploymentIds)
    const previousDeploymentId = last(deploymentIds)
    if (previousDeploymentId) {
      return loadDeployment(previousDeploymentId, app)
    }
  }
}

export default loadPreviousDeployment
