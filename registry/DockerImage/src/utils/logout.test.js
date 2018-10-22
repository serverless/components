const execa = require('execa')
const logout = require('./logout')

jest.mock('execa')

execa.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#logout()', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it('should logout of the Docker registry ', async () => {
    const registryUrl = 'https://my-registry:8080'

    const res = await logout(registryUrl)

    expect(res).toEqual(true)
    expect(execa).toHaveBeenCalledWith('docker', ['logout', registryUrl])
  })

  it('should not use the registryUrl as a CLI argument if the public Docker registry is used', async () => {
    const registryUrl = 'https://hub.docker.com'

    const res = await logout(registryUrl)

    expect(res).toEqual(true)
    expect(execa).toHaveBeenCalledWith('docker', ['logout'])
  })
})
