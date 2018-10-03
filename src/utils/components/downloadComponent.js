import log from '../logging/log'

const download = require('download')
const path = require('path')
const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
  await fse.ensureDirAsync(downloadedComponentRootPath)
  log(`Downloading component package: ${path.basename(url)}`)
  return download(url, downloadedComponentRootPath, { extract: true })
}
