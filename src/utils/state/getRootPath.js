function getRootPath(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].rootPath) {
    return stateFile[componentId].rootPath
  }
  return null
}

module.exports = getRootPath
