// sample universal function signature for unit/integration testing...
module.exports.hello = (cloudEvent) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Received CloudEvent from: ${cloudEvent.source}`
    })
  }
}
