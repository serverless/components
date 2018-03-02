const path = require('path')
const writeFile = require('../fs/writeFile')

module.exports = async (state) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  return writeFile(stateFilePath, state)
}
