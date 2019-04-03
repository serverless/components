const path = require('path')
const fileExists = require('./fileExists')

const loadComponent = async (query) => {
  // todo check if requested component is using a compatible version of core
  const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))

  if (await fileExists(externalComponentPath)) {
    return require(externalComponentPath)
  }
  return require(query)
}

module.exports = loadComponent
