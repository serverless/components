import { append, get, reduce } from '@serverless/utils'

const getChildrenIds = (component) => {
  return reduce(
    (accum, child) => {
      return append(get('instanceId', component.children[child]), accum)
    },
    [],
    Object.keys(get('children', component))
  )
}

export default getChildrenIds
