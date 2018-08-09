const { writeFile } = require('@serverless/utils')
const path = require('path')

module.exports = async (config, content) => {
  const { projectPath, state } = config
  const stateFilePath =
    state && state.file ? path.resolve(state.file) : path.join(projectPath, 'state.json')
  return writeFile(stateFilePath, content)
}
