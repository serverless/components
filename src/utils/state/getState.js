function getState(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].state) {
    return stateFile[componentId].state
  }
  return {}
}

module.exports = getState
