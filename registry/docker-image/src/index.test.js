const {
  checkDockerSetup,
  buildImage,
  login,
  pushImage,
  logout,
  removeImage,
  getToken,
  deleteImage
} = require('./utils')
const dockerComponent = require('./index')

jest.mock('./utils/checkDockerSetup')
jest.mock('./utils/buildImage')
jest.mock('./utils/login')
jest.mock('./utils/pushImage')
jest.mock('./utils/logout')
jest.mock('./utils/removeImage')
jest.mock('./utils/getToken')
jest.mock('./utils/deleteImage')

checkDockerSetup.mockImplementation(() => Promise.resolve(true))
buildImage.mockImplementation(() => Promise.resolve('https://my-registry:8080/jdoe/my-image'))
login.mockImplementation(() => Promise.resolve(true))
pushImage.mockImplementation(() => Promise.resolve('https://my-registry:8080/jdoe/my-image'))
logout.mockImplementation(() => Promise.resolve(true))
removeImage.mockImplementation(() => Promise.resolve('https://my-registry:8080/jdoe/my-image'))
getToken.mockImplementation(() => 'jwt-auth-token')
deleteImage.mockImplementation(() => Promise.resolve())

afterAll(() => {
  jest.restoreAllMocks()
})

describe('docker-image tests', () => {
  let tag
  let inputs
  let context

  beforeEach(() => {
    jest.clearAllMocks()

    tag = 'https://my-registry:8080/jdoe/my-image'
    inputs = {
      dockerfilePath: './Dockerfile',
      contextPath: '.',
      tag: 'https://my-registry:8080/jdoe/my-image',
      registryUrl: 'https://my-registry:8080',
      username: 'jdoe',
      password: 's0m3p455w0rd'
    }
    context = {
      state: {
        ...inputs
      },
      log: jest.fn(),
      saveState: jest.fn()
    }
  })

  describe('when running "build"', () => {
    it('should successfully build an image', async () => {
      const outputs = await dockerComponent.build(inputs, context)

      const expectedState = { ...inputs }
      delete expectedState.username
      delete expectedState.password

      expect(outputs).toEqual({ tag })
      expect(checkDockerSetup).toHaveBeenCalledTimes(1)
      expect(buildImage).toBeCalledWith(inputs.dockerfilePath, inputs.tag, inputs.contextPath)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "deploy"', () => {
    it('should push the image to the Docker registry', async () => {
      const outputs = await dockerComponent.deploy(inputs, context)

      const expectedState = { ...inputs }
      delete expectedState.username
      delete expectedState.password

      expect(outputs).toEqual({ tag })
      expect(checkDockerSetup).toHaveBeenCalledTimes(1)
      expect(login).toBeCalledWith(inputs.username, inputs.password, inputs.registryUrl)
      expect(pushImage).toBeCalledWith(inputs.tag)
      expect(logout).toBeCalledWith(inputs.registryUrl)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })

    it('should build the image if it was not built beforehand', async () => {
      // empty state --> image was not built
      context.state = {}
      const outputs = await dockerComponent.deploy(inputs, context)

      const expectedState = { ...inputs }
      delete expectedState.username
      delete expectedState.password

      expect(outputs).toEqual({ tag })
      expect(checkDockerSetup).toHaveBeenCalledTimes(2)
      expect(buildImage).toBeCalledWith(inputs.dockerfilePath, inputs.tag, inputs.contextPath)
      expect(login).toBeCalledWith(inputs.username, inputs.password, inputs.registryUrl)
      expect(pushImage).toBeCalledWith(inputs.tag)
      expect(logout).toBeCalledWith(inputs.registryUrl)
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toBeCalledWith(expectedState)
    })
  })

  describe('when running "remove"', () => {
    it('should remove the image locally and from the Docker registry', async () => {
      const outputs = await dockerComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(checkDockerSetup).toHaveBeenCalledTimes(1)
      expect(removeImage).toBeCalledWith(context.state.tag)
      expect(getToken).toBeCalledWith(inputs.username, inputs.password, context.state.registryUrl)
      expect(deleteImage).toBeCalledWith(
        'jwt-auth-token',
        context.state.tag,
        context.state.registryUrl
      )
      expect(context.log).toHaveBeenCalled()
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })
})
