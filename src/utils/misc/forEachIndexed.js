const { addIndex, forEach } = require('ramda')

const forEachIndexed = addIndex(forEach)

module.exports = forEachIndexed
