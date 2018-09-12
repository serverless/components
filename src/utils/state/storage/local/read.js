const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')

module.exports = async (config) => {
  const { projectPath, state } = config
  const stateFilePath =
    state && state.file ? path.resolve(state.file) : path.join(projectPath, 'state.json')
  if (!(await fileExists(stateFilePath))) {
    return {}
  }
  const content = await readFile(stateFilePath)
  return content
}
