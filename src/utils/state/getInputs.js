function getInputs(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].inputs) {
    return stateFile[componentId].inputs
  }
  return {}
}

module.exports = getInputs
