const path = require('path')
const fileExists = require('./fileExists')

const coreComponentsRoot = path.resolve(__dirname, '../../../components')

const loadComponent = async (query) => {
  const coreComponentPath = path.join(coreComponentsRoot, query, 'serverless.js')
  const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))

  if (await fileExists(externalComponentPath)) {
    return require(externalComponentPath)
  } else if (await fileExists(coreComponentPath)) {
    return require(coreComponentPath)
  }
  throw Error(`Component ${query} not found`)
}

module.exports = loadComponent
