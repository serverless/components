import { get } from '@serverless/utils'

const getParentId = (component) => {
  const parent = get('parent', component)
  if (parent) {
    return get('id', parent)
  }
  return null
}

export default getParentId
