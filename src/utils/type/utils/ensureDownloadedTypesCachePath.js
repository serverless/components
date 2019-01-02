import fs from 'fs-extra'
import getDownloadedTypesCachePath from './getDownloadedTypesCachePath'

const ensureDownloadedTypesCachePath = async () => {
  const cachePath = getDownloadedTypesCachePath()
  await fs.ensureDir(cachePath)
  return cachePath
}

export default ensureDownloadedTypesCachePath
