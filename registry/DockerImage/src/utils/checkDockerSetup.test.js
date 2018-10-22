const checkDockerSetup = require('./checkDockerSetup')
const isDockerInstalled = require('./isDockerInstalled')
const isDockerRunning = require('./isDockerRunning')

jest.mock('./isDockerInstalled')
jest.mock('./isDockerRunning')

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#checkDockerSetup()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should throw if Docker is not installed', async () => {
    isDockerInstalled.mockImplementation(() => false)
    // NOTE: docker can't be running if it's not installed
    isDockerRunning.mockImplementation(() => false)

    await expect(checkDockerSetup()).rejects.toThrow('Docker not installed')
    expect(isDockerInstalled).toHaveBeenCalledTimes(1)
    expect(isDockerRunning).toHaveBeenCalledTimes(0)
  })

  it('should throw if Docker is not running', async () => {
    isDockerInstalled.mockImplementation(() => true)
    isDockerRunning.mockImplementation(() => false)

    await expect(checkDockerSetup()).rejects.toThrow('Docker not running')
    expect(isDockerInstalled).toHaveBeenCalledTimes(1)
    expect(isDockerRunning).toHaveBeenCalledTimes(1)
  })

  it('should resolve with true if Docker is installed and running', async () => {
    isDockerInstalled.mockImplementation(() => true)
    isDockerRunning.mockImplementation(() => true)

    const res = await checkDockerSetup()

    expect(res).toEqual(true)
    expect(isDockerInstalled).toHaveBeenCalledTimes(1)
    expect(isDockerRunning).toHaveBeenCalledTimes(1)
  })
})
