const path = require('path')
const { fileExists, readFile } = require('@serverless/utils')

module.exports = async () => {
  const stateFilePath = path.join(process.cwd(), 'state.json')

  if (!(await fileExists(stateFilePath))) {
    return {}
  }
  return readFile(stateFilePath)
}
