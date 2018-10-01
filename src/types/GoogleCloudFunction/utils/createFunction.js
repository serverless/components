async function createFunction(provider, location, params) {
  return provider.request('cloudfunctions', 'v1', 'projects', 'locations', 'functions', 'create', {
    location,
    resource: params
  })
}

module.exports = createFunction
