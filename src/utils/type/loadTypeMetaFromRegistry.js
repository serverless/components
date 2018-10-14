import getRegistryBucketRoot from '../registry/getRegistryBucketRoot'
import loadTypeMetaFromUrl from './loadTypeMetaFromUrl'

const loadTypeMetaFromRegistry = async (registryQuery, context) => {
  const url = `${getRegistryBucketRoot()}/${registryQuery}.zip`
  const typeMeta = await loadTypeMetaFromUrl(url, context)
  return {
    ...typeMeta,
    query: registryQuery
  }
}

export default loadTypeMetaFromRegistry
