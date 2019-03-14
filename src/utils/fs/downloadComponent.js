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
const downloadComponent = async (gitRepoBranch, nameVersionPair) => {
  const localRegistryPath = path.join(os.homedir(), '.serverless', 'components', 'registry')

  await ensureDir(localRegistryPath)

  const gitRepoBranchHash = crypto
    .createHash('sha256')
    .update(gitRepoBranch)
    .digest('hex')
    .substring(0, 10)

  const componentDir = path.join(localRegistryPath, nameVersionPair || gitRepoBranchHash)

  if (await dirExists(componentDir)) {
    return componentDir
  }

  try {
    await downloadGitRepo(gitRepoBranch, componentDir)
    await exec('npm i', { cwd: componentDir })
    return componentDir
  } catch (e) {
    // if an error happened in between, we'd have a broken component that we can't overwrite
    // so we gotta remove that broken component from the local cache
    await remove(componentDir)
    throw e
  }
}

module.exports = downloadComponent
