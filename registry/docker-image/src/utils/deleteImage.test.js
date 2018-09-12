const fetch = require('node-fetch')
const deleteImage = require('./deleteImage')

jest.mock('node-fetch')

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#deleteImage()', () => {
  const token = 'jwt-auth-token'
  const registryUrl = 'https://my-registry:8080'
  const tag = 'https://my-registry:8080/jdoe/my-image:latest'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete the image from the Docker registry', async () => {
    await deleteImage(token, tag, registryUrl)

    expect(fetch).toHaveBeenCalledWith('https://my-registry:8080/v2/repositories/jdoe/my-image', {
      method: 'DELETE',
      headers: {
        Authorization: 'JWT jwt-auth-token'
      }
    })
  })
})
