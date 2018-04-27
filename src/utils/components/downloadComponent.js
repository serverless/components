const download = require('download')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const log = require('../log')
const { fse } = require('../fs')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
  await fse.ensureDirAsync(downloadedComponentRootPath)
  log(`Downloading component => ${url}`)
  return download(
    url, downloadedComponentRootPath,
    { extract: true, strip: 1 }
  )
}
