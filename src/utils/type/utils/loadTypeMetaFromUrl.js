import fse from 'fs-extra'
import downloadType from './downloadType'
import anyTypeFileExistsAtPath from '../anyTypeFileExistsAtPath'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'
import resolveDownloadedTypePath from './resolveDownloadedTypePath'

const loadTypeMetaFromUrl = async (url, context) => {
  const downloadedTypePath = resolveDownloadedTypePath(url)
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
