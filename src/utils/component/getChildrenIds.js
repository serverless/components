import { append, get, isNil, keys, reduce, resolve } from '@serverless/utils'

const getChildrenIds = (component) => {
  const children = get('children', component)
  if (children) {
    return reduce(
      (accum, childKey) => {
        const instanceId = resolve(get('instanceId', children[childKey]))
        if (isNil(instanceId)) {
          throw new Error(
            `Found a child without an instanceId while getting children ids. This should not happen. The child was ${
              children[childKey]
            } and belongs to parent ${component}`
          )
        }
        return append(instanceId, accum)
      },
      [],
      keys(children)
    )
  }
  return []
}

export default getChildrenIds
