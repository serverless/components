const path = require('path')
const getComponentsCachePath = require('./getComponentsCachePath')

module.exports = async (url) => {
  const componentsCachePath = await getComponentsCachePath()
  const componentName = url.substr(url.lastIndexOf('/') + 1).slice(0, -4)
  const downloadedComponentRootPath = path.join(componentsCachePath, componentName)
  return downloadedComponentRootPath
}
