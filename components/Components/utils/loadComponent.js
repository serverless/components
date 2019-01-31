const path = require('path')
const { LOCAL_REGISTRY_PATH } = require('../constants')

function loadComponent(name) {
  // TODO: implement logic to load from different sources like
  // local file system, remote registry, etc.
  const component = path.join(LOCAL_REGISTRY_PATH, name, 'serverless.js')
  return require(component)
}

module.exports = loadComponent
