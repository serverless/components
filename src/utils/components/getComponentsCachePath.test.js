const BbPromise = require('bluebird')
const path = require('path')
const os = require('os')
const getComponentsCachePath = require('./getComponentsCachePath')

jest.mock('bluebird', () => {
  const mocks = {
    ensureDirAsync: jest.fn().mockReturnValue(Promise.resolve(true))
  }
  return {
    mocks: mocks,
    promisifyAll: () => mocks
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('#getComponentsCachePath', () => {
  it('should return components cache path and create it if it does not exist', async () => {
    const expectedComponentsCachePath = path.join(os.homedir(), '.serverless', 'components', 'cache')
    const componentsCachePath = await getComponentsCachePath()
    expect(componentsCachePath).toEqual(expectedComponentsCachePath)
    expect(BbPromise.mocks.ensureDirAsync).toBeCalledWith(expectedComponentsCachePath)
  })
})
