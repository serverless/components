const path = require('path')

function getRootPath(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].rootPath) {
    return path.resolve(stateFile[componentId].rootPath)
  }
  return null
}

module.exports = getRootPath
