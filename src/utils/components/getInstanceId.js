const generateInstanceId = require('./generateInstanceId')

function getInstanceId(stateFile, componentId) {
  if (stateFile[componentId] && stateFile[componentId].instanceId) {
    return stateFile[componentId].instanceId
  }
  return generateInstanceId(stateFile.serviceId)
}

module.exports = getInstanceId
