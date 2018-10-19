const SDK = require('@serverless/event-gateway-sdk')

async function createEventType(inputs) {
  const { url, space, accessKey, name, authorizerId } = inputs
  const eg = new SDK({ url, space, accessKey })

  return eg.createEventType({ name, authorizerId })
}

module.exports = createEventType
