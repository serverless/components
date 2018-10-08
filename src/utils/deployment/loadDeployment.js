import { dirExists } from '@serverless/utils'
import newDeployment from './newDeployment'

const loadDeployment = async (id, app) => {
  const { project } = app
  const path = join(project.path, '.serverless', 'apps', app.id, 'deployments', id)
  if (!(await dirExists(path))) {
    throw new Error(
      `Cannot load deployment directory. Deployment directory '${path}' does not exist.`
    )
  }
  return newDeployment({
    app,
    id,
    path
  })
}

export default loadDeployment
