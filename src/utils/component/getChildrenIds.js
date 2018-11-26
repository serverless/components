import { view, lensPath } from 'ramda'
import { append, get, equals, walkReduce, resolve } from '@serverless/utils'

const getChildrenIds = (component) => {
  const children = get('children', component)
  if (children) {
    let currChildStartPath = []
    return walkReduce(
      (accum, value, pathParts) => {
        // the first iteration starts with an empty array
        if (pathParts.length) {
          const pathPartWoLastElement = pathParts.slice(0, pathParts.length - 1)
          const lastPathPart = pathParts.slice(-1).pop()
          if (lastPathPart === 'instanceId' && equals(currChildStartPath, pathPartWoLastElement)) {
            const instanceId = resolve(view(lensPath(pathParts), children))
            return append(instanceId, accum)
          }
          currChildStartPath = pathParts
        }
        return accum
      },
      [],
      children
    )
  }
  return []
}

export default getChildrenIds
