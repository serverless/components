const { keys, reduce } = require('ramda')
const track = require('./track')

module.exports = async (components) => {
  const types = reduce((accum, componentId) => {
    const { type } = components[componentId]
    accum[type] = (accum[type] ? ++accum[type] : 1) // eslint-disable-line
    return accum
  }, {}, keys(components))

  const trackingData = {
    components: {
      total: keys(components).length,
      types,
      ids: keys(components)
    }
  }
  return track('Deployment', trackingData)
}
