const {
  addIndex,
  map
} = require('ramda')

const mapIndexed = addIndex(map)

module.exports = mapIndexed
