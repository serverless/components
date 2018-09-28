const execa = require('execa')
const pushImage = require('./pushImage')

jest.mock('execa')

execa.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#pushImage()', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it('should push the image to the Docker registry', async () => {
    const tag = 'https://my-registry:8080/jdoe/my-image'

    const res = await pushImage(tag)

    expect(res).toEqual(tag)
    expect(execa).toHaveBeenCalledWith('docker', ['push', tag])
  })
})
