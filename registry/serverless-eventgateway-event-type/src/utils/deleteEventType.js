const SDK = require('@serverless/event-gateway-sdk')

async function deleteEventType(inputs) {
  const { url, space, accessKey, name } = inputs
  const eg = new SDK({ url, space, accessKey })

  await eg.deleteEventType({ name })
  return true
}

module.exports = deleteEventType
