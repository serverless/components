const { writeFile } = require('@serverless/utils')
const path = require('path')
const chalk = require('chalk')

const { encrypt } = require('../encryption/crypt')
const { log } = require('../../utils/logging')

module.exports = async (projectPath, content) => {
  const stateFilePath = path.join(projectPath, 'state.json')

  let contentToSave
  if (process.env.COMPONENTS_ENC_STATE !== 'true') {
    log(
      chalk.red(
        'Remember to encrypt state.json with "components encrypt" before committing it to source control!'
      )
    )
    contentToSave = content
  } else {
    contentToSave = {
      encrypted: encrypt(
        'aes-256-cbc',
        process.env.COMPONENTS_ENC_KEY,
        process.env.COMPONENTS_ENC_IV,
        JSON.stringify(content),
        'base64'
      )
    }
  }

  return writeFile(stateFilePath, contentToSave)
}
