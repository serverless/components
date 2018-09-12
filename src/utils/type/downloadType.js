import download from 'download'
import { ensureDir } from 'fs-extra'
import path from 'path'
const fse = BbPromise.promisifyAll(require('fs-extra'))
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const log = require('../logging/log')

const downloadType = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
  await fse.ensureDirAsync(downloadedComponentRootPath)
  log(`Downloading component package: ${path.basename(url)}`)
  return download(url, downloadedComponentRootPath, { extract: true })
}

export default downloadType
