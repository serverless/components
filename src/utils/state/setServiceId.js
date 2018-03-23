const { assoc } = require('ramda')
const getServiceId = require('./getServiceId')

function setServiceId(stateFile) {
  return assoc('serviceId', getServiceId(stateFile), stateFile)
}

module.exports = setServiceId
