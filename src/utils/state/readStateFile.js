const path = require('path')
const fileExists = require('../fs/fileExists')
const readFile = require('../fs/readFile')

module.exports = async () => {
  const stateFilePath = path.join(process.cwd(), 'state.json')

  if (!await fileExists(stateFilePath)) {
    return {}
  }
  const state = await readFile(stateFilePath)
  return state
}
