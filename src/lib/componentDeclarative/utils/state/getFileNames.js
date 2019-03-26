const path = require('path')
const fse = require('fs-extra')

async function getFileNames() {
  const stateFilesDir = path.join(process.cwd(), '.serverless')
  const files = await fse.readdir(stateFilesDir)
  return files.filter((file) => file.match(/declarative\..+\.json/))
}
module.exports = getFileNames
