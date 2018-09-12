import { get } from '@serverless/utils'

const REGISTRY_URL = 'https://s3.amazonaws.com/serverless-components-registry'

const getRegistryUrl = (context) => get('registry.url', context) || REGISTRY_URL

export default getRegistryUrl
