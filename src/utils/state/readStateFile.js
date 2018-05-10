const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')

module.exports = async (projectDirPath) => {
  const stateFilePath = path.join(projectDirPath, 'state.json')
  if (!(await fileExists(stateFilePath))) {
    return {}
  }
  return readFile(stateFilePath)
}
