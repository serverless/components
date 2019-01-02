import resolveDownloadedTypePath from '../../utils/resolveDownloadedTypePath'

const typeMetaCacheKey = (query) => resolveDownloadedTypePath(query)

export default typeMetaCacheKey
