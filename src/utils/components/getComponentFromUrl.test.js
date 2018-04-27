const getComponentFromUrl = require('./getComponentFromUrl')

describe('#getComponentFromUrl', () => {
  it('should download component', async () => {
    jest.setTimeout(20000)
    const downloadedComponentRootPath = await getComponentFromUrl('https://github.com/serverless/components/archive/master.zip')
    console.log(downloadedComponentRootPath)
  })
})
