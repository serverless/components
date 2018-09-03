function getOutputs(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].outputs) {
    return stateFile[componentId].outputs
  }
  return {}
}

module.exports = getOutputs
