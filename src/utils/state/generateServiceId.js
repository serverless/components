const getRandomId = require('../misc/getRandomId')

function generateServiceId() {
  return getRandomId(12)
}

module.exports = generateServiceId
