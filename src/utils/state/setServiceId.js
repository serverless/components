const { assocPath } = require('ramda')
const getServiceId = require('./getServiceId')

function setServiceId(stateFile) {
  return assocPath([ '$', 'serviceId' ], getServiceId(stateFile), stateFile)
}

module.exports = setServiceId
