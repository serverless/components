const path = require('path')
const { writeFile } = require('@serverless/utils')

const writeState = async (id, state = {}) => {
  const stateFilePath = path.join(process.cwd(), '.serverless', `${id}.json`)
  return writeFile(stateFilePath, state)
}

module.exports = writeState
