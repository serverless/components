const { writeFile } = require('@serverless/utils')
const path = require('path')
const chalk = require('chalk')
const { log } = require('../../../../utils/logging')

module.exports = async (config, content) => {
  const { projectPath, state } = config
  const stateFilePath =
    state && state.file ? path.resolve(state.file) : path.join(projectPath, 'state.json')
  if (process.env.COMPONENTS_ENC_STATE !== 'true') {
    log(
      chalk.red(
        'Remember to encrypt state.json with "components encrypt --state" before committing it to source control!'
      )
    )
  }
  return writeFile(stateFilePath, content)
}
