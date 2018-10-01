async function getOperation(provider, name) {
  return provider.request('cloudfunctions', 'v1', 'operations', 'get', {
    name
  })
}

module.exports = getOperation
