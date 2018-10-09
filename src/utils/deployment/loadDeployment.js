import { dirExists, toInteger } from '@serverless/utils'
import { join } from 'path'
import newDeployment from './newDeployment'
import parseDeploymentNumber from './parseDeploymentNumber'

const loadDeployment = async (id, app) => {
  const { project } = app
  const path = join(project.path, '.serverless', 'apps', app.id, 'deployments', id)
  if (!(await dirExists(path))) {
    throw new Error(
      `Cannot load deployment directory. Deployment directory '${path}' does not exist.`
    )
  }
  const number = parseDeploymentNumber(id)
  return newDeployment({
    app,
    id,
    number
  })
}

export default loadDeployment
