const SDK = require('@serverless/event-gateway-sdk')

async function updateCors(inputs) {
  const {
    url,
    space,
    accessKey,
    corsId,
    method,
    path,
    allowedOrigins,
    allowedMethods,
    allowedHeaders,
    allowCredentials
  } = inputs
  const eg = new SDK({ url, space, accessKey })

  return eg.updateCORS({
    corsId,
    method,
    path,
    allowedOrigins,
    allowedMethods,
    allowedHeaders,
    allowCredentials
  })
}

module.exports = updateCors
