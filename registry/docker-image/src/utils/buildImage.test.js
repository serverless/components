const execa = require('execa')
const buildImage = require('./buildImage')

jest.mock('execa')

execa.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#buildImage()', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it('should build the image', async () => {
    const dockerfilePath = './Dockerfile'
    const tag = 'jdoe/my-project:latest'
    const contextPath = '.'

    const res = await buildImage(dockerfilePath, tag, contextPath)

    expect(res).toEqual(tag)
    expect(execa).toHaveBeenCalledWith('docker', [
      'build',
      '--file',
      dockerfilePath,
      '--tag',
      tag,
      contextPath
    ])
  })
})
