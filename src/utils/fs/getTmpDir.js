const os = require('os')
const path = require('path')
const crypto = require('crypto')
const fse = require('../fs/fse')

async function getTmpDir() {
  const tmpDirPath = path.join(
    os.tmpdir(),
    'tmpdirs-serverless-components',
    crypto.randomBytes(8).toString('hex')
  )

  await fse.ensureDirAsync(tmpDirPath)

  return tmpDirPath
}

module.exports = getTmpDir
