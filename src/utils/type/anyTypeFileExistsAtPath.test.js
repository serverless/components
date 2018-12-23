import utils from '@serverless/utils'
import anyTypeFileExistsAtPath from './anyTypeFileExistsAtPath'

jest.mock('@serverless/utils', () => ({
  ...require.requireActual('@serverless/utils'),
  fileExists: jest.fn()
}))

describe('#anyTypeFileExistsAtPath()', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('should test for serverless.json files', async () => {
    utils.fileExists.mockImplementation(async (path) => {
      return path === '/test/serverless.json'
    })
    const result = await anyTypeFileExistsAtPath('/test')
    expect(result).toBe(true)
  })

  it('should test for serverless.js files', async () => {
    utils.fileExists.mockImplementation(async (path) => {
      return path === '/test/serverless.js'
    })
    const result = await anyTypeFileExistsAtPath('/test')
    expect(result).toBe(true)
  })

  it('should test for serverless.yaml files', async () => {
    utils.fileExists.mockImplementation(async (path) => {
      return path === '/test/serverless.yaml'
    })
    const result = await anyTypeFileExistsAtPath('/test')
    expect(result).toBe(true)
  })

  it('should test for serverless.yml files', async () => {
    utils.fileExists.mockImplementation(async (path) => {
      return path === '/test/serverless.yml'
    })
    const result = await anyTypeFileExistsAtPath('/test')
    expect(result).toBe(true)
  })

  it('should return false when no serverless files are found', async () => {
    utils.fileExists.mockImplementation(async () => false)
    const result = await anyTypeFileExistsAtPath('/test')
    expect(result).toBe(false)
  })
})
