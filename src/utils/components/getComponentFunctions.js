const path = require('path')
const getRegistryRoot = require('../getRegistryRoot')
const requireFns = require('./requireFns')

function getComponentFunctions(type) {
  const componentRoot = path.join(getRegistryRoot(), type)
  return requireFns(componentRoot)
}

module.exports = getComponentFunctions
