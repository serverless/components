const SDK = require('@serverless/event-gateway-sdk')

async function updateEventType(inputs) {
  const { url, space, accessKey, name, authorizerId } = inputs
  const eg = new SDK({ url, space, accessKey })

  return eg.updateEventType({ name, authorizerId })
}

module.exports = updateEventType
