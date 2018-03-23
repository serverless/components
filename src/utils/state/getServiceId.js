const generateServiceId = require('./generateServiceId')

function getServiceId(stateFile) {
  return (stateFile.$ && stateFile.$.serviceId) || generateServiceId()
}

module.exports = getServiceId
