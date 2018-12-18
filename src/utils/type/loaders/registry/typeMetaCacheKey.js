import resolveDownloadedTypePath from '../../utils/resolveDownloadedTypePath'
import getRegistryBucketRoot from '../../../registry/getRegistryBucketRoot'

const typeMetaCacheKey = (query) => {
  const url = `${getRegistryBucketRoot()}/${query}.zip`
  return resolveDownloadedTypePath(url)
}

export default typeMetaCacheKey
