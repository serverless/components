const SDK = require('@serverless/event-gateway-sdk')

async function deleteCors(inputs) {
  const { url, space, accessKey, corsId } = inputs
  const eg = new SDK({ url, space, accessKey })

  await eg.deleteCORS({ corsId })
  return true
}

module.exports = deleteCors
