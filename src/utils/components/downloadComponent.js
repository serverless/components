const download = require('download')
const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const log = require('../log')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
  await fse.ensureDirAsync(downloadedComponentRootPath)
  log(`Downloading component from => ${url}`)
  return download(url, downloadedComponentRootPath, { extract: true, strip: 1 })
}
