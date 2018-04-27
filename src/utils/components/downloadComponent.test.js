const downloadComponent = require('./downloadComponent')
const download = require('download')
const getComponentRootPathFromUrl = require('./getComponentRootPathFromUrl')

jest.mock('download')

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  download.mockClear()
})

describe('#downloadComponent', () => {
  it('should download component', async () => {
    const url = 'https://example.com/test.zip'
    const downloadedComponentRootPath = await getComponentRootPathFromUrl(url)
    await downloadComponent(url)
    expect(download).toBeCalledWith(url, downloadedComponentRootPath, { extract: true, filename: 'test', strip: 1 })
  })
})
