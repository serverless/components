import { append, get, keys, reduce, resolve } from '@serverless/utils'

const getChildrenIds = (component) => {
  const children = get('children', component)
  if (children) {
    return reduce(
      (accum, childKey) => append(resolve(get('instanceId', children[childKey])), accum),
      [],
      keys(children)
    )
  }
  return []
}

export default getChildrenIds
