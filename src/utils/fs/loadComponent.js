const registry = require('../../../registry.json')
const path = require('path')
const root = require('./root')
const fileExists = require('./fileExists')
const downloadComponent = require('./downloadComponent')

const getCoreComponent = async (componentName) => {
  const coreComponentPath = path.join(root, 'components', componentName, 'serverless.js')
  if (await fileExists(coreComponentPath)) {
    return require(coreComponentPath)
  }
  return null
}

const isCommunityComponent = (query) =>
  registry[query] || (query.includes('@') && registry[query.split('@')[0]])

const isPathComponent = async (query) => {
  const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))
  return fileExists(externalComponentPath)
}

const isGitComponent = (query) => query.split('/').length === 2 && !query.startsWith('.')

const loadComponent = async (query) => {
  const coreComponent = await getCoreComponent(query)

  if (coreComponent) {
    return coreComponent
  } else if (isCommunityComponent(query)) {
    // community component
    const name = query.split('@')[0]
    const branch = query.split('@')[1]

    const url = registry[name].repo
    const repo = url.replace('https://github.com/', '')
    const gitRepoBranch = branch ? `${repo}#${branch}` : repo

    const downloadedComponentPath = await downloadComponent(gitRepoBranch, query)
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
