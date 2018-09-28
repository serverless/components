const SDK = require('@serverless/event-gateway-sdk')

async function deleteFunction(inputs) {
  const { url, space, accessKey, functionId } = inputs
  const eg = new SDK({ url, space, accessKey })

  await eg.deleteFunction({ functionId })
  return true
}

module.exports = deleteFunction
