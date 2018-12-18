import { isUrl } from '@serverless/utils'

const match = (query) => isUrl(query)

export default match
