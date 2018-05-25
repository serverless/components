const { writeFile } = require('@serverless/utils')
const path = require('path')

module.exports = async (projectPath, content) => {
  const stateFilePath = path.join(projectPath, 'state.json')
  return writeFile(stateFilePath, content)
}
