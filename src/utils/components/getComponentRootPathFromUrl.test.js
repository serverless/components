const path = require('path')
const crypto = require('crypto')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const getComponentsCachePath = require('./getComponentsCachePath')

describe('#getComponentRootPathFromUrl', () => {
  it('should return component root path from url', async () => {
    const componentsCachePath = await getComponentsCachePath()
    const url = 'https://example.com/test.zip'
    const urlHash = crypto
      .createHash('sha256')
      .update(url)
      .digest('hex')
    const expectedDownloadedComponentRootPath = path.join(
      componentsCachePath,
      urlHash
    )
    const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
    expect(downloadedComponentRootPath).toEqual(expectedDownloadedComponentRootPath)
  })
})
