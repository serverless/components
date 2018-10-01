async function deleteFunction(provider, name) {
  return provider.request('cloudfunctions', 'v1', 'projects', 'locations', 'functions', 'delete', {
    name
  })
}

module.exports = deleteFunction
