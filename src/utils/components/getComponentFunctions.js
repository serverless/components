const path = require('path')
const getRegistryRoot = require('../getRegistryRoot')
const requireFns = require('./requireFns')

function getComponentFunctions(type) {
  let componentRoot
  const cwd = process.cwd()
  const dirName = cwd.split(path.sep).pop()
  if (dirName === type) {
    componentRoot = cwd
  } else {
    componentRoot = path.join(getRegistryRoot(), type)
  }
  return requireFns(componentRoot)
}

module.exports = getComponentFunctions
