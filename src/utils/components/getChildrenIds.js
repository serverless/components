const { mapObjIndexed } = require('ramda')

const getChildrenIds = (component) =>
  mapObjIndexed((child) => child.id, component.components)

module.exports = getChildrenIds
