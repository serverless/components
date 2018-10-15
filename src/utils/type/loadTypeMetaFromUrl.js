import crypto from 'crypto'
import path from 'path'
import fse from 'fs-extra'

import downloadType from './downloadType'
import anyTypeFileExistsAtPath from './anyTypeFileExistsAtPath'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'
import getDownloadedTypesCachePath from './getDownloadedTypesCachePath'

const loadTypeMetaFromUrl = async (url, context) => {
  const downloadedTypesCachePath = await getDownloadedTypesCachePath()
  const urlHash = crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')

  const downloadedTypePath = path.join(downloadedTypesCachePath, urlHash)
  const isDownloaded = await anyTypeFileExistsAtPath(downloadedTypePath)

  if (!isDownloaded) {
    await fse.ensureDirAsync(downloadedTypePath)
    await downloadType(url, downloadedTypePath)
  }

  const typeMeta = await loadTypeMetaFromPath(downloadedTypePath, context)
  return {
    ...typeMeta,
    query: url
  }
}

export default loadTypeMetaFromUrl
