const { mapObjIndexed, prop } = require('ramda')

const getChildrenPromises = (component, components) =>
  mapObjIndexed(
    (childComponentId) => prop(childComponentId, components).promise,
    component.children
  )

module.exports = getChildrenPromises
