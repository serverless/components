import { keys, reduce } from '@serverless/utils'
import track from './track'

const trackDeployment = async (components) => {
  const types = reduce(
    (accum, componentId) => {
      const { type } = components[componentId]
      accum[type] = accum[type] ? ++accum[type] : 1 // eslint-disable-line
      return accum
    },
    {},
    keys(components)
  )

  return track('Deployment', {
    components: {
      total: keys(components).length,
      types,
      ids: keys(components)
    }
  })
}

export default trackDeployment
