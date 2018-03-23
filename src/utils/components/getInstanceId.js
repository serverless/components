const generateInstanceId = require('./generateInstanceId')

function getInstanceId(stateFile, componentId) {
  if (!stateFile[componentId]) {
    stateFile[componentId] = {}
  }

  if (!stateFile[componentId].instanceId) {
    stateFile[componentId].instanceId = generateInstanceId(stateFile.$.serviceId)
  }

  return stateFile[componentId].instanceId
}

module.exports = getInstanceId
