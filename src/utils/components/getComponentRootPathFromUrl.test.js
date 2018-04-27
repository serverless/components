const path = require('path')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')
const getComponentsCachePath = require('./getComponentsCachePath')

describe('#getComponentRootPathFromUrl', () => {
  it('should return component root path from url', async () => {
    const componentsCachePath = await getComponentsCachePath()
    const expectedDownloadedComponentRootPath = path.join(componentsCachePath, 'test')
    const url = 'https://example.com/test.zip'
    const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
    expect(downloadedComponentRootPath).toEqual(expectedDownloadedComponentRootPath)
  })
})
