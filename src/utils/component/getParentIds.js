import { get, concat } from '@serverless/utils'

const getParentIds = (component) => {
  const parent = get('parent', component)
  if (parent) {
    return concat([get('instanceId', parent)], getParentIds(parent))
  }
  return []
}

export default getParentIds
