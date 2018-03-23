const path = require('path')
const writeFile = require('../fs/writeFile')

module.exports = async (content) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  return writeFile(stateFilePath, content)
}
