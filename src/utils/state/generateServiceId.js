const getRandomId = require('../misc/getRandomId')

function generateServiceId() {
  return getRandomId(10)
}

module.exports = generateServiceId
