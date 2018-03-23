const getRandomId = require('../misc/getRandomId')

function generateInstanceId(serviceId) {
  const suffixId = getRandomId(8)
  return `${serviceId}-${suffixId}`
}

module.exports = generateInstanceId
