const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')
const { decrypt } = require('../encryption/crypt')

module.exports = async (projectPath) => {
  const stateFilePath = path.join(projectPath, 'state.json')
  if (!(await fileExists(stateFilePath))) {
    return {}
  }

  let content = await readFile(stateFilePath)

  if (content.encrypted) {
    content = JSON.parse(
      decrypt(
        'aes-256-cbc',
        process.env.COMPONENTS_ENC_KEY,
        process.env.COMPONENTS_ENC_IV,
        content.encrypted,
        'base64'
      )
    )
    process.env.COMPONENTS_ENC_STATE = true
  }

  return content
}
