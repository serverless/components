import { writeFile } from '@serverless/utils'
import path from 'path'

const write = async (config, content) => {
  const { projectPath, state } = config
  const stateFilePath =
    state && state.file ? path.resolve(state.file) : path.join(projectPath, 'state.json')
  return writeFile(stateFilePath, content)
}

export default write
