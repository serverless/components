const { generateRandomId } = require('@serverless/utils')

function generateServiceId() {
  return generateRandomId(10)
}

module.exports = generateServiceId
