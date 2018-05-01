const path = require('path')
const { isNil } = require('ramda')
const getRegistryRoot = require('../registry/getRegistryRoot')

function getComponentRootPath(type = null) {
  if (isNil(type)) {
    return process.cwd()
  } else if (type.match(/(.+\/)+/)) {
    return path.resolve(type)
  }
  return path.join(getRegistryRoot(), type)
}

module.exports = getComponentRootPath
