const { resolve } = require('path')

function getRootPath(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].rootPath) {
    return resolve(stateFile[componentId].rootPath)
  }
  return null
}

module.exports = getRootPath
