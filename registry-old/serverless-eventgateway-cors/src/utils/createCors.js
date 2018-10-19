const SDK = require('@serverless/event-gateway-sdk')

async function createCors(inputs) {
  const {
    url,
    space,
    accessKey,
    method,
    path,
    allowedOrigins,
    allowedMethods,
    allowedHeaders,
    allowCredentials
  } = inputs
  const eg = new SDK({ url, space, accessKey })

  return eg.createCORS({
    method,
    path,
    allowedOrigins,
    allowedMethods,
    allowedHeaders,
    allowCredentials
  })
}

module.exports = createCors
