const {
  addIndex,
  reduce
} = require('ramda')

const reduceIndexed = addIndex(reduce)

module.exports = reduceIndexed
