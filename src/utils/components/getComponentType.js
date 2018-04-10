const path = require('path')
const getRegistryRoot = require('../getRegistryRoot')

function getComponentType(componentRootPath) {
  const registryRootPath = getRegistryRoot()
  if (componentRootPath.includes(registryRootPath)) {
    return componentRootPath.split(path.sep).pop()
  }
  return componentRootPath
}

module.exports = getComponentType
