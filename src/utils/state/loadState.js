import { readFile } from '@serverless/utils'
import { join } from 'path'

const loadState = async (deployment) => {
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
  return readFile(stateFilePath)
}

export default loadState
