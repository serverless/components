const { writeFile } = require('@serverless/utils')
const path = require('path')
const chalk = require('chalk')

const { encryptState } = require('./encryptState')
const { log } = require('../../utils/logging')

module.exports = async (projectPath, content) => {
  const stateFilePath = path.join(projectPath, 'state.json')

  if (process.env.COMPONENTS_ENC_STATE !== 'true') {
    log(
      chalk.red(
        'Remember to encrypt state.json with "components encrypt" before committing it to source control!'
      )
    )
  }

  return writeFile(stateFilePath, encryptState(content))
}
