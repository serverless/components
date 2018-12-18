import resolveTypePath from '../../utils/resolveTypePath'

const typeMetaCacheKey = (query, context) => resolveTypePath(query, context)

export default typeMetaCacheKey
