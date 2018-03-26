const { mapObjIndexed, prop } = require('ramda')

const getChildrenIds = (component) =>
  mapObjIndexed((child) => child.id, prop('components', component))

module.exports = getChildrenIds
