const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')
const { decryptState } = require('./encryptState')

module.exports = async (projectPath) => {
  const stateFilePath = path.join(projectPath, 'state.json')
  if (!(await fileExists(stateFilePath))) {
    return {}
  }

  const content = await readFile(stateFilePath)

  return decryptState(content)
}
