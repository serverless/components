const getInputs = (stateFile, componentId) => {
  if (stateFile[componentId] && stateFile[componentId].inputs) {
    return stateFile[componentId].inputs
  }
  return {}
}

export default getInputs
