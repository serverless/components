const getCloudEvent = (event) => {
  // todo check if cloud event and transform to cloud event
  return event
}

module.exports.handler = (e, ctx, cb) => {
  delete require.cache[require.resolve('./index')]
  const context = {
    name: ctx.functionName,
    invocationId: ctx.awsRequestId
  }
  try {
    const fileName = `${process.env.SERVERLESS_HANDLER.split('.')[0]}.js`
    const library = require(fileName)
    const functionName = process.env.SERVERLESS_HANDLER.split('.')[1]
    const returnValue = library[functionName](getCloudEvent(e), context)
    return Promise.resolve(returnValue)
      .then((res) => cb(null, res))
      .catch((err) => cb(err))
  } catch (err) {
    return cb(err)
  }
}
