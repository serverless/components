import getRegistryBucketRoot from '../../../registry/getRegistryBucketRoot'
import loadTypeMetaFromUrl from '../../utils/loadTypeMetaFromUrl'

const loadTypeMeta = async (registryQuery, context) => {
  const url = `${getRegistryBucketRoot()}/${registryQuery}.zip`
  const typeMeta = await loadTypeMetaFromUrl(url, context)
  return {
    ...typeMeta,
    query: registryQuery
  }
}

export default loadTypeMeta
