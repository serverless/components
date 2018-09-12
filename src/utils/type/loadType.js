import defType from './defType'
import loadTypeMeta from './loadTypeMeta'

const loadType = async (query, context) => {
  const typeMeta = await loadTypeMeta(query, context)
  return defType(typeMeta, context)
}

export default loadType
