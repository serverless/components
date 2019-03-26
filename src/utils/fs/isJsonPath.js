const { endsWith } = require('ramda')

const isJsonPath = endsWith('.json')

module.exports = isJsonPath
