const BbPromise = require('bluebird')
const fse = BbPromise.promisifyAll(require('fs-extra'))
const downloadComponent = require('./downloadComponent')
const getComponentFromUrl = require('./getComponentFromUrl')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')

jest.mock('./downloadComponent')

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  downloadComponent.mockClear()
})

describe('#getComponentFromUrl', () => {
  it('should download component', async () => {
    const componentName = String((new Date()).getTime())
    const url = `https://example.com/${componentName}.zip`
    const downloadedComponentRootPath = await getComponentFromUrl(url)
    const expectedDownloadedComponentRootPath = await getComponentRootPathFromUrl(url)
    expect(downloadedComponentRootPath).toEqual(expectedDownloadedComponentRootPath)
    expect(downloadComponent).toBeCalledWith(url)
  })

  it('should not download component if it is in cache', async () => {
    const url = 'https://example.com/test.zip'
    const expectedDownloadedComponentRootPath = await getComponentRootPathFromUrl(url)
    await fse.ensureDirAsync(expectedDownloadedComponentRootPath)
    const downloadedComponentRootPath = await getComponentFromUrl(url)
    expect(downloadedComponentRootPath).toEqual(expectedDownloadedComponentRootPath)
    expect(downloadComponent).not.toBeCalled()
  })
})
