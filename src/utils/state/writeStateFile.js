const { writeFile } = require('@serverless/utils')
const path = require('path')

module.exports = async (projectDirPath, content) => {
  const stateFilePath = path.join(projectDirPath, 'state.json')
  return writeFile(stateFilePath, content)
}
