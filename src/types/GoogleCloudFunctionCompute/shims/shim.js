exports.shim = (...args) => {
  // load the "uniform function"
  const fileName = process.env.SERVERLESS_HANDLER.split('.')[0]
  const exportedFunction = process.env.SERVERLESS_HANDLER.split('.')[1]
  const filePath = `./${fileName}.js`
  const universalFunction = require(filePath)

  const isHttpEvent = typeof args[1].status === 'function' // see: http://expressjs.com/en/api.html#res.status

  let data
  let context
  let callback
  let request
  let response
  if (isHttpEvent) {
    request = args[0]
    response = args[1]
    data = request.body
    context = {} // TODO: where is the context in the HTTP event?
  } else if (args.length === 2) {
    // this is a Node.js 6 "background function"
    data = args[0].data
    context = args[0].context
    callback = args[1]
  } else {
    // this is a Node.js 8 "background function"
    data = args[0]
    context = args[1]
    callback = args[2]
  }

  const eventType = isHttpEvent ? 'google.http' : 'google.background-event' // TODO: update the eventType?!
  const source = isHttpEvent ? 'http' : 'background-event' // TODO: update the source?!
  const cloudEvent = {
    eventTime: new Date().getTime(),
    eventID: new Date().getTime(),
    eventType,
    source,
    data
  }

  // invoke the universal function
  let result
  let error
  try {
    result = universalFunction[exportedFunction](cloudEvent, context)
  } catch (err) {
    error = err
  }

  // return the response
  if (isHttpEvent) {
    const { statusCode, body } = result
    if (error) return response.status(500).send(JSON.stringify(error))
    return response.status(statusCode).send(body)
  } else {
    if (error) return Promise.reject(error).then((err) => callback(err))
    return Promise.resolve(result)
      .then(() => callback(null, result))
      .catch((err) => callback(err))
  }
}
