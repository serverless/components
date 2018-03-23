const getRandomId = require('../misc/getRandomId')

function getServiceId() {
  return getRandomId(12)
}

module.exports = getServiceId
