const execa = require('execa')
const removeImage = require('./removeImage')

jest.mock('execa')

execa.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#removeImage()', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it('should remove the image locally', async () => {
    const tag = 'jdoe/my-project:latest'

    const res = await removeImage(tag)

    expect(res).toEqual(tag)
    expect(execa).toHaveBeenCalledWith('docker', ['rmi', '--force', true, tag])
  })
})
