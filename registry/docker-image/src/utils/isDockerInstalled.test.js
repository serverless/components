const which = require('which')
const isDockerInstalled = require('./isDockerInstalled')

jest.mock('which')

which.mockImplementationOnce((cmd, cb) => cb(null, 'path-to-bin'))
which.mockImplementationOnce((cmd, cb) => cb(new Error('not found'), null))

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#isDockerInstalled()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should detect if Docker is installed', async () => {
    const res = await isDockerInstalled()

    expect(which).toHaveBeenCalledTimes(1)
    expect(res).toEqual(true)
  })

  it('should return false if Docker is not installed', async () => {
    const res = await isDockerInstalled()

    expect(which).toHaveBeenCalledTimes(1)
    expect(res).toEqual(false)
  })
})
