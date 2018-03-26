const { mapObjIndexed, prop } = require('ramda')

const getChildrenPromises = (component, components) =>
  mapObjIndexed(
    (childComponentId) => prop(childComponentId, components).promise,
    prop('children', component)
  )

module.exports = getChildrenPromises
