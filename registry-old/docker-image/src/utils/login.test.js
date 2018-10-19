const execa = require('execa')
const login = require('./login')

jest.mock('execa')

execa.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#login()', () => {
  const username = 'jdoe'
  const password = 's0m3p455w0rd'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it('should login to the Docker registry ', async () => {
    const registryUrl = 'https://my-registry:8080'

    const res = await login(username, password, registryUrl)

    expect(res).toEqual(true)
    expect(execa).toHaveBeenCalledWith('docker', [
      'login',
      '--username',
      username,
      '--password',
      password,
      registryUrl
    ])
  })

  it('should not use the registryUrl as a CLI argument if the public Docker registry is used', async () => {
    const registryUrl = 'https://hub.docker.com'

    const res = await login(username, password, registryUrl)

    expect(res).toEqual(true)
    expect(execa).toHaveBeenCalledWith('docker', [
      'login',
      '--username',
      username,
      '--password',
      password
    ])
  })
})
