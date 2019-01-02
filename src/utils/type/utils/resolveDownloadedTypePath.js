import crypto from 'crypto'
import path from 'path'
import getDownloadedTypesCachePath from './getDownloadedTypesCachePath'

const resolveDownloadedTypePath = (url) => {
  const downloadedTypesCachePath = getDownloadedTypesCachePath()
  const urlHash = crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')

  return path.join(downloadedTypesCachePath, urlHash)
}

export default resolveDownloadedTypePath
