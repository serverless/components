const path = require('path')
const fse = require('fs-extra')

async function getFileNames(stage) {
  const stateFilesDir = path.join(process.cwd(), '.serverless')
  const files = await fse.readdir(stateFilesDir)
  const regex = new RegExp(`${stage}.declarative\..+\.json`)
  return files.filter((file) => file.match(regex))
}
module.exports = getFileNames
