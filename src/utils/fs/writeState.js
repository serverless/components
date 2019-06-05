const path = require('path')
const writeFile = require('./writeFile')

const writeState = async (root, id, state = {}) => {
  const stateFilePath = path.join(root, '.serverless', `${id}.json`)
  return writeFile(stateFilePath, state)
}

module.exports = writeState
