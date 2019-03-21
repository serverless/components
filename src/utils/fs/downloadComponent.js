const path = require('path')
const { ensureDir, remove } = require('fs-extra')
const os = require('os')
const crypto = require('crypto')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const dirExists = require('./dirExists')
const downloadGitRepo = require('./downloadGitRepo')

/*
 * Download Component
 *   Downloads a component from github from a given repo/branch fragment
 *   ex. serverless/serverless -> downloads master branch
 *   ex. serverless/serverless#dev -> downloads dev branch
 *   ex. serverless/serverless#v1.0.0 -> downloads v1.0.0 tag/branch
 */
const downloadComponent = async (gitRepoBranch, componentDirName) => {
  const localRegistryPath = path.join(os.homedir(), '.serverless', 'components', 'registry')

  await ensureDir(localRegistryPath)

  const gitRepoBranchHash = crypto
    .createHash('sha256')
    .update(gitRepoBranch)
    .digest('hex')
    .substring(0, 10)

  const componentDirPath = path.join(localRegistryPath, componentDirName || gitRepoBranchHash)

  if (await dirExists(componentDirPath)) {
    return path.join(componentDirPath, 'serverless.js')
  }

  try {
    await downloadGitRepo(gitRepoBranch, componentDirPath)
    await exec('npm install', { cwd: componentDirPath })
    return path.join(componentDirPath, 'serverless.js')
  } catch (e) {
    // if an error happened in between, we'd have a broken component that we can't overwrite
    // so we gotta remove that broken component from the local cache
    await remove(componentDirPath)
    throw e
  }
}

module.exports = downloadComponent
