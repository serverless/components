import { concat, prop } from '@serverless/utils'

const getParentIds = (component) => {
  const parent = prop('parent', component)
  if (parent) {
    return concat([parent.id], getParentIds(parent))
  }
  return []
}

export default getParentIds
