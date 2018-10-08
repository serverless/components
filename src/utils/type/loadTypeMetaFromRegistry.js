import getRegistryBucketRoot from '../registry/getRegistryBucketRoot'
import loadTypeMetaFromUrl from './loadTypeMetaFromUrl'

const loadTypeMetaFromRegistry = async (registryQuery, context) => {
  const url = `${getRegistryBucketRoot()}/${registryQuery}.zip`
  return loadTypeMetaFromUrl(url, context)
}

export default loadTypeMetaFromRegistry
