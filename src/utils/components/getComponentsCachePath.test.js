const path = require('path')
const os = require('os')
const fs = require('../fs')
const getComponentsCachePath = require('./getComponentsCachePath')

jest.mock('../fs', () => ({
  fse: {
    ensureDirAsync: jest.fn()
  }
}))

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  fs.fse.ensureDirAsync.mockClear()
})

describe('#getComponentsCachePath', () => {
  it('should return components cache path and create it if it does not exist', async () => {
    const expectedComponentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
    const componentsCachePath = await getComponentsCachePath()
    expect(componentsCachePath).toEqual(expectedComponentsCachePath)
    expect(fs.fse.ensureDirAsync).toBeCalledWith(expectedComponentsCachePath)
  })
})
