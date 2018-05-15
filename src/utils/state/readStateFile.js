const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')

module.exports = async (projectPath) => {
  const stateFilePath = path.join(projectPath, 'state.json')
  if (!(await fileExists(stateFilePath))) {
    return {}
  }
  return readFile(stateFilePath)
}
