const { writeFile } = require('@serverless/utils')
const path = require('path')

module.exports = async (content) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  return writeFile(stateFilePath, content)
}
