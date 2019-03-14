const components = require('../../../registry.json')
const path = require('path')
const root = require('./root')
const fileExists = require('./fileExists')
const downloadComponent = require('./downloadComponent')

const isCoreComponent = (query) => components[query] && typeof components[query] === 'string'

const isCommunityComponent = (query) => {
  return (
    query.includes('@') &&
    components[query.split('@')[0]] &&
    components[query.split('@')[0]][query.split('@')[1]]
  )
}

const isPathComponent = async (query) => {
  const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))
  return fileExists(externalComponentPath)
}

const isGitComponent = (query) => query.split('/').length === 2 && !query.startsWith('.')

const loadComponent = async (query) => {
  if (isCoreComponent(query)) {
    // core component
    const coreComponentPath = path.join(root, components[query], 'serverless.js')

    return require(coreComponentPath)
  } else if (isCommunityComponent(query)) {
    // community component
    const name = query.split('@')[0]
    const version = query.split('@')[1]

    const downloadedComponentPath = await downloadComponent(components[name][version], query)
    return require(downloadedComponentPath)
  } else if (await isPathComponent(query)) {
    // direct path
    const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))
    // todo check if external component is using a compatible version of core
    return require(externalComponentPath)
  } else if (isGitComponent(query)) {
    // direct git url
    const downloadedComponentPath = await downloadComponent(query)
    // todo check if external component is using a compatible version of core
    return require(downloadedComponentPath)
  }

  throw Error(`Component ${query} not found`)
}

module.exports = loadComponent
