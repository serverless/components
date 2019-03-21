const registry = require('../../../registry.json')
const path = require('path')
const root = require('./root')
const fileExists = require('./fileExists')
const downloadComponent = require('./downloadComponent')
const getComponentLatestVersion = require('./getComponentLatestVersion')

const isRegistryComponent = (query) => query.includes('@') && registry[query.split('@')[0]]

const isPathComponent = async (query) => {
  const externalComponentPath = path.resolve(path.join(query, 'serverless.js'))
  return fileExists(externalComponentPath)
}

const isGitComponent = (query) =>
  query.split('/').length === 2 && !query.startsWith('.') && !query.startsWith('@')

const loadComponent = async (query) => {
  if (isRegistryComponent(query)) {
    // community component
    const name = query.split('@')[0]

    const url = registry[name].repo
    const ownerRepo = url.replace('https://github.com/', '')
    const version = query.split('@')[1]

    const ownerRepoVersion = `${ownerRepo}#${version}`
    const dirName = `${name}@${version}`

    const downloadedComponentPath = await downloadComponent(ownerRepoVersion, dirName)
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
  const npmComponentPath = path.join(process.cwd(), 'node_modules', query)
  return require(npmComponentPath)
}

module.exports = loadComponent
