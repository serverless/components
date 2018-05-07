const path = require('path')
const { fileExists } = require('@serverless/utils')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const downloadComponent = require('./downloadComponent')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)

  if (
    await fileExists(path.join(downloadedComponentRootPath, 'serverless.yml'))
  ) {
    return downloadedComponentRootPath
  }

  await downloadComponent(url)

  return downloadedComponentRootPath
}
