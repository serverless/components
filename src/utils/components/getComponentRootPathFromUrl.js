const path = require('path')
const crypto = require('crypto')
const getComponentsCachePath = require('./getComponentsCachePath')

module.exports = async (url) => {
  const componentsCachePath = await getComponentsCachePath()
  const urlHash = crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')
  const downloadedComponentRootPath = path.join(componentsCachePath, urlHash)
  return downloadedComponentRootPath
}
