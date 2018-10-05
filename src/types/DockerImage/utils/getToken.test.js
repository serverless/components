const fetch = require('node-fetch')
const getToken = require('./getToken')

jest.mock('node-fetch', () =>
  jest.fn(() =>
    Promise.resolve({
      json: () => ({ token: 'jwt-auth-token' })
    })
  )
)

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#getToken()', () => {
  const username = 'jdoe'
  const password = 's0m3p455w0rd'
  const registryUrl = 'https://my-registry:8080'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get a JWT token from the Docker registry', async () => {
    const res = await getToken(username, password, registryUrl)

    expect(res).toEqual('jwt-auth-token')
    expect(fetch).toHaveBeenCalledWith('https://my-registry:8080/v2/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    })
  })
})
