const SDK = require('@serverless/event-gateway-sdk')

async function unsubscribe(inputs) {
  const { url, space, accessKey, subscriptionId } = inputs
  const eg = new SDK({ url, space, accessKey })

  await eg.unsubscribe({ subscriptionId })
  return true
}

module.exports = unsubscribe
