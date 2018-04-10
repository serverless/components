const path = require('path')
const getRegistryRoot = require('../getRegistryRoot')
const { isNil } = require('ramda')

function getComponentRootPath(type = null) {
  if (isNil(type)) {
    return process.cwd()
  } else if (type.match(/(.+\/)+/)) {
    return path.resolve(type)
  }
  return path.join(getRegistryRoot(), type)
}

module.exports = getComponentRootPath
