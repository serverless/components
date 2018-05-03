const download = require('download')
const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const log = require('../log')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
  await fse.ensureDirAsync(downloadedComponentRootPath)
  const componentName = url.substr(url.lastIndexOf('/') + 1).slice(0, -4)
  log(`Downloading component: ${componentName}`)
  return download(
    url, downloadedComponentRootPath,
    { extract: true, strip: 1 }
  )
}
