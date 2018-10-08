import { writeFile } from '@serverless/utils'
import { ensureFile } from 'fs-extra'
import { join } from 'path'

const saveState = async (deployment, state) => {
  // TODO BRN: Replace this with the state store options
  const { app, id } = deployment
  const { project } = app
  const stateFilePath = join(
    project.path,
    '.serverless',
    'apps',
    app.id,
    'deployments',
    id,
    'state.json'
  )

  return writeFile(stateFilePath, state)
}

export default saveState
