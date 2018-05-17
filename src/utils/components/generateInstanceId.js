const { generateRandomId } = require('@serverless/utils')

function generateInstanceId(serviceId) {
  const suffixId = generateRandomId(8)
  return `${serviceId}-${suffixId}`
}

module.exports = generateInstanceId
