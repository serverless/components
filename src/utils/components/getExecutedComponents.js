const { keys, reduce } = require('ramda')

module.exports = (components) => {
  const executedComponents = reduce(
    (accum, componentId) => {
      const component = components[componentId]
      if (component.executed) {
        accum[componentId] = components[componentId]
      }
      return accum
    },
    {},
    keys(components)
  )
  return executedComponents
}
