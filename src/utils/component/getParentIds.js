import { get, concat } from '@serverless/utils'

const getParentIds = (component) => {
  const parent = get('parent', component)
  if (parent) {
    return concat([get('id', parent)], getParentIds(parent))
  }
  return []
}

export default getParentIds
