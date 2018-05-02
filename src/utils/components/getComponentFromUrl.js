const { dirExists } = require('@serverless/utils')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const downloadComponent = require('./downloadComponent')

module.exports = async (url) => {
  const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)

  if (await dirExists(downloadedComponentRootPath)) {
    return downloadedComponentRootPath
  }

  await downloadComponent(url)

  return downloadedComponentRootPath
}
