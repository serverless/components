import { get } from '@serverless/utils'

const getParentId = (component) => {
  const parent = get('parent', component)
  if (parent) {
    return get('instanceId', parent)
  }
  return null
}

export default getParentId
