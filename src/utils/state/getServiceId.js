const generateServiceId = require('./generateServiceId')

function getServiceId(stateFile) {
  return stateFile.serviceId || generateServiceId()
}

module.exports = getServiceId
